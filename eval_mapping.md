# Eliza Feedback-Based Evaluation Framework for Mapping Service

## Overview
This evaluation framework is designed for a system where:
- **Eliza** (internal LLM system) provides mapping recommendations
- **Feedback UI** displays Eliza's output in a grid for user review
- **User overrides** update the ground truth mapping collection
- **Ground truth collection** is provided as a tool to Eliza for continuous learning

---

## 1. Ground Truth Management & Quality

### 1.1 Ground Truth Collection Structure

```python
class GroundTruthMapping:
    """
    Structure for ground truth mappings maintained through user feedback
    """
    id: str
    source_account: {
        'code': str,
        'description': str,
        'account_type': str,
        'metadata': dict
    }
    target_account: {
        'code': str,
        'description': str,
        'account_type': str,
        'metadata': dict
    }
    confidence: float  # Confidence in this ground truth
    
    # Feedback metadata
    created_by: str
    created_at: datetime
    last_updated: datetime
    override_count: int  # Number of times this was overridden
    validation_count: int  # Number of times this was confirmed
    
    # Learning metadata
    original_eliza_suggestion: dict  # What Eliza originally suggested
    override_reason: str  # Why user overrode Eliza
    similar_patterns: List[str]  # Similar mappings that should follow this pattern
    
    # Quality indicators
    consistency_score: float  # How consistent with other ground truths
    reliability_score: float  # Based on validation history
    last_validated: datetime

class GroundTruthCollection:
    """
    Collection of ground truth mappings
    """
    mappings: List[GroundTruthMapping]
    version: str
    last_updated: datetime
    total_entries: int
    
    # Collection metrics
    coverage: float  # Percentage of source accounts covered
    consistency: float  # Internal consistency score
    reliability: float  # Overall reliability based on validation
    
    # Usage tracking
    times_accessed_by_eliza: int
    last_accessed: datetime
    effectiveness_metrics: dict
```

### 1.2 Ground Truth Quality Metrics

```python
class GroundTruthQualityEvaluator:
    """
    Evaluate the quality of ground truth collection
    """
    
    def evaluate_consistency(self, ground_truth: GroundTruthCollection) -> float:
        """
        Test: Internal consistency of ground truth mappings
        Target: ≥ 95% consistency
        
        Checks:
        - Same source accounts don't map to different targets
        - Similar accounts follow similar patterns
        - Account type mappings are logically consistent
        """
        inconsistencies = []
        
        # Check for duplicate source accounts
        source_codes = {}
        for mapping in ground_truth.mappings:
            src = mapping.source_account['code']
            if src in source_codes:
                if source_codes[src] != mapping.target_account['code']:
                    inconsistencies.append({
                        'type': 'duplicate_source',
                        'source': src,
                        'targets': [source_codes[src], mapping.target_account['code']]
                    })
            else:
                source_codes[src] = mapping.target_account['code']
        
        # Check pattern consistency
        pattern_violations = self._check_pattern_consistency(ground_truth.mappings)
        inconsistencies.extend(pattern_violations)
        
        consistency_score = 1 - (len(inconsistencies) / len(ground_truth.mappings))
        return max(0, consistency_score * 100)
    
    def evaluate_coverage(self, ground_truth: GroundTruthCollection, 
                          all_source_accounts: List[Account]) -> float:
        """
        Test: Coverage of source accounts in ground truth
        Target: ≥ 60% coverage after 100 feedback sessions
        """
        covered_accounts = set(m.source_account['code'] for m in ground_truth.mappings)
        all_accounts = set(a.code for a in all_source_accounts)
        
        coverage = len(covered_accounts) / len(all_accounts)
        return coverage * 100
    
    def evaluate_reliability(self, ground_truth: GroundTruthCollection) -> float:
        """
        Test: Reliability based on validation history
        Target: ≥ 90% of entries validated at least once
        
        Factors:
        - Validation count vs override count
        - Time since last validation
        - Consistency with other mappings
        """
        reliable_entries = 0
        
        for mapping in ground_truth.mappings:
            # High validation, low override = reliable
            if mapping.validation_count >= 2 and mapping.override_count == 0:
                reliable_entries += 1
            # Recent validation = reliable
            elif (datetime.now() - mapping.last_validated).days < 30:
                reliable_entries += 1
            # High consistency score = reliable
            elif mapping.consistency_score >= 0.9:
                reliable_entries += 1
        
        reliability = reliable_entries / len(ground_truth.mappings)
        return reliability * 100
    
    def identify_stale_entries(self, ground_truth: GroundTruthCollection) -> List[GroundTruthMapping]:
        """
        Test: Identify entries that may be outdated
        Target: < 10% stale entries
        
        Stale if:
        - Not validated in > 90 days
        - High override count (>3)
        - Low consistency with recent entries
        """
        stale_threshold_days = 90
        stale_entries = []
        
        for mapping in ground_truth.mappings:
            days_since_validation = (datetime.now() - mapping.last_validated).days
            
            if days_since_validation > stale_threshold_days:
                stale_entries.append(mapping)
            elif mapping.override_count > 3:
                stale_entries.append(mapping)
            elif mapping.consistency_score < 0.7:
                stale_entries.append(mapping)
        
        return stale_entries

# Ground Truth Quality Benchmarks
ground_truth_benchmarks = {
    'consistency': {
        'target': '≥ 95%',
        'critical': True,
        'description': 'No conflicting mappings for same source'
    },
    'coverage': {
        'target': '≥ 60% after 100 sessions',
        'critical': False,
        'description': 'Percentage of source accounts with ground truth'
    },
    'reliability': {
        'target': '≥ 90%',
        'critical': True,
        'description': 'Validated and consistent entries'
    },
    'staleness': {
        'target': '< 10%',
        'critical': False,
        'description': 'Outdated entries needing revalidation'
    }
}
```

---

## 2. Eliza Learning Effectiveness Evaluation

### 2.1 Learning from Ground Truth

```python
class ElizaLearningEvaluator:
    """
    Evaluate how well Eliza learns from ground truth feedback
    """
    
    def test_ground_truth_application(self):
        """
        Test: Does Eliza correctly apply ground truth to new mappings?
        Target: ≥ 95% accuracy when ground truth exists
        """
        test_scenarios = [
            {
                'name': 'Exact match in ground truth',
                'setup': {
                    'ground_truth': [
                        {'source': '1000', 'target': '1001', 'validated': True}
                    ],
                    'new_request': {'source': '1000'}
                },
                'expected': {
                    'target': '1001',
                    'confidence': '>95%',
                    'reasoning': 'References ground truth'
                }
            },
            {
                'name': 'Similar pattern in ground truth',
                'setup': {
                    'ground_truth': [
                        {'source': '5100-Travel-Domestic', 'target': '5010'},
                        {'source': '5200-Travel-International', 'target': '5020'}
                    ],
                    'new_request': {'source': '5300-Travel-Local'}
                },
                'expected': {
                    'applies_pattern': True,
                    'suggests': 'Target in 50XX range',
                    'confidence': '75-90%'
                }
            },
            {
                'name': 'Override learned from feedback',
                'setup': {
                    'ground_truth': [
                        {
                            'source': '6000-Supplies',
                            'target': '6100',
                            'original_eliza_suggestion': '6200',
                            'override_reason': 'Office supplies go to 6100, not 6200'
                        }
                    ],
                    'new_request': {'source': '6001-Office-Supplies'}
                },
                'expected': {
                    'suggests': '6100',
                    'does_not_suggest': '6200',
                    'reasoning_mentions': 'Previous feedback'
                }
            }
        ]
        
        return self.run_test_scenarios(test_scenarios)
    
    def test_pattern_extraction(self):
        """
        Test: Can Eliza extract patterns from ground truth?
        Target: Detect patterns within 5-10 similar ground truth entries
        """
        test_cases = [
            {
                'name': 'Account type consistency',
                'ground_truth_entries': [
                    {'source_type': 'Expense', 'target_range': '5000-5999'} * 10
                ],
                'test_request': {'source_type': 'Expense', 'code': '5850'},
                'expected_behavior': 'Suggests target in 5000-5999 range'
            },
            {
                'name': 'Description keyword patterns',
                'ground_truth_entries': [
                    {'desc_contains': 'Travel', 'target_prefix': '50'} * 8,
                    {'desc_contains': 'Travel', 'target_prefix': '51'} * 2
                ],
                'test_request': {'description': 'Employee Travel Reimbursement'},
                'expected_behavior': 'Prioritizes 50XX targets (dominant pattern)'
            },
            {
                'name': 'User preference patterns',
                'ground_truth_entries': [
                    {'match_type': 'exact_code', 'accepted': True} * 15,
                    {'match_type': 'semantic_desc', 'accepted': False} * 8
                ],
                'test_request': {'options': ['exact_code', 'semantic_desc']},
                'expected_behavior': 'Prioritizes exact code matches'
            }
        ]
        
        return self.run_pattern_tests(test_cases)
    
    def test_override_learning(self):
        """
        Test: Does Eliza adapt when users consistently override?
        Target: Adjust within 3-5 overrides of similar mappings
        """
        learning_scenario = {
            'iterations': [
                {
                    'round': 1,
                    'eliza_suggests': '6200-Office Supplies',
                    'user_overrides_to': '6100-General Supplies',
                    'reason': 'We use 6100 for all supplies'
                },
                {
                    'round': 2,
                    'eliza_suggests': '6200-IT Supplies',
                    'user_overrides_to': '6100-General Supplies',
                    'reason': 'Same - all supplies to 6100'
                },
                {
                    'round': 3,
                    'eliza_suggests': '6200-Manufacturing Supplies',
                    'user_overrides_to': '6100-General Supplies',
                    'reason': 'All supplies!'
                },
                {
                    'round': 4,
                    'new_request': 'Marketing Supplies',
                    'eliza_should_suggest': '6100-General Supplies',
                    'eliza_should_not_suggest': '6200'
                }
            ],
            'success_criteria': 'Adapts by round 4 (after 3 consistent overrides)'
        }
        
        return self.run_learning_scenario(learning_scenario)
    
    def test_contextual_reasoning(self):
        """
        Test: Does Eliza provide good reasoning based on ground truth?
        Target: ≥ 85% of responses include relevant ground truth context
        """
        reasoning_tests = [
            {
                'scenario': 'Multiple similar ground truths exist',
                'expected_reasoning_includes': [
                    'References to similar mappings',
                    'Pattern identified across X entries',
                    'Consistency with established mappings'
                ]
            },
            {
                'scenario': 'Ground truth contradicts initial suggestion',
                'expected_reasoning_includes': [
                    'Acknowledgment of user preference',
                    'Reference to previous override',
                    'Updated suggestion based on feedback'
                ]
            },
            {
                'scenario': 'No relevant ground truth exists',
                'expected_reasoning_includes': [
                    'Acknowledgment of new pattern',
                    'Request for user guidance',
                    'Suggestion to establish new ground truth'
                ]
            }
        ]
        
        return self.evaluate_reasoning_quality(reasoning_tests)

# Eliza Learning Benchmarks
eliza_learning_benchmarks = {
    'ground_truth_accuracy': {
        'target': '≥ 95% when exact match exists',
        'critical': True
    },
    'pattern_application': {
        'target': '≥ 85% when pattern exists',
        'critical': True
    },
    'adaptation_speed': {
        'target': 'Learn within 3-5 similar overrides',
        'critical': True
    },
    'reasoning_quality': {
        'target': '≥ 85% include ground truth context',
        'critical': False
    },
    'false_application_rate': {
        'target': '< 5% incorrect pattern application',
        'critical': True
    }
}
```

---

## 3. Feedback UI Effectiveness Evaluation

### 3.1 User Interaction Metrics

```python
class FeedbackUIEvaluator:
    """
    Evaluate the feedback UI where users review and override Eliza's suggestions
    """
    
    def test_override_patterns(self):
        """
        Test: Analyze patterns in user overrides
        Target: < 30% override rate for established patterns
        """
        metrics = {
            'overall_override_rate': {
                'calculation': 'Overrides / Total suggestions',
                'target': '< 30%',
                'insight': 'Lower rate = better Eliza learning'
            },
            'override_rate_by_confidence': {
                'high_confidence': {
                    'target': '< 10%',
                    'description': 'High confidence should rarely be overridden'
                },
                'medium_confidence': {
                    'target': '< 30%',
                    'description': 'Medium confidence expected override rate'
                },
                'low_confidence': {
                    'target': '< 60%',
                    'description': 'Low confidence often needs override'
                }
            },
            'override_rate_trend': {
                'target': 'Decreasing over time',
                'description': 'System should improve with feedback'
            }
        }
        
        return self.analyze_override_patterns(metrics)
    
    def test_feedback_quality(self):
        """
        Test: Quality of user feedback provided during overrides
        Target: ≥ 70% of overrides include reason
        """
        quality_checks = {
            'reason_provided': {
                'target': '≥ 70%',
                'importance': 'High',
                'impact': 'Enables better learning'
            },
            'reason_clarity': {
                'target': '≥ 80% actionable',
                'measurement': 'Can Eliza extract pattern from reason?'
            },
            'consistency_of_feedback': {
                'target': '≥ 90%',
                'measurement': 'Same source gets same feedback from user'
            }
        }
        
        return self.evaluate_feedback_quality(quality_checks)
    
    def test_feedback_loop_latency(self):
        """
        Test: Time from override to ground truth update to Eliza access
        Target: < 1 minute for full feedback loop
        """
        latency_metrics = {
            'override_to_db_update': {
                'target': '< 5 seconds',
                'critical': True
            },
            'db_update_to_tool_availability': {
                'target': '< 30 seconds',
                'critical': True
            },
            'eliza_access_latency': {
                'target': '< 2 seconds',
                'critical': False
            },
            'end_to_end': {
                'target': '< 1 minute',
                'critical': True
            }
        }
        
        return self.measure_feedback_latency(latency_metrics)
    
    def test_user_confidence_calibration(self):
        """
        Test: Are users confident in their overrides?
        Target: ≥ 90% of overrides are not later re-overridden
        """
        stability_metrics = {
            'override_stability': {
                'calculation': 'Overrides not changed again / Total overrides',
                'target': '≥ 90%',
                'insight': 'High stability = users are confident and correct'
            },
            'validation_rate': {
                'calculation': 'Other users validate override / Total overrides',
                'target': '≥ 80%',
                'insight': 'High validation = good override quality'
            }
        }
        
        return self.evaluate_override_stability(stability_metrics)

# Feedback UI Benchmarks
feedback_ui_benchmarks = {
    'override_rate': {
        'target': '< 30% overall, decreasing trend',
        'critical': True
    },
    'feedback_quality': {
        'target': '≥ 70% include reason',
        'critical': False
    },
    'feedback_loop_latency': {
        'target': '< 1 minute end-to-end',
        'critical': True
    },
    'override_stability': {
        'target': '≥ 90%',
        'critical': True
    }
}
```

---

## 4. Ground Truth Tool Integration Evaluation

### 4.1 Tool Availability & Performance

```python
class GroundTruthToolEvaluator:
    """
    Evaluate the ground truth tool provided to Eliza
    """
    
    def test_tool_availability(self):
        """
        Test: Is ground truth tool reliably available to Eliza?
        Target: ≥ 99.9% uptime
        """
        availability_metrics = {
            'uptime': {
                'target': '≥ 99.9%',
                'measurement': 'Tool available when Eliza calls'
            },
            'response_time': {
                'target': '< 2 seconds',
                'measurement': 'Time to return ground truth data'
            },
            'data_freshness': {
                'target': '< 5 minutes',
                'measurement': 'Time from override to tool reflects change'
            }
        }
        
        return self.measure_tool_availability(availability_metrics)
    
    def test_tool_query_efficiency(self):
        """
        Test: Can Eliza efficiently query relevant ground truth?
        Target: < 3 tool calls per mapping request
        """
        query_patterns = [
            {
                'scenario': 'Exact source account lookup',
                'expected_calls': 1,
                'query_type': 'Direct lookup by source code'
            },
            {
                'scenario': 'Pattern-based lookup',
                'expected_calls': 1-2,
                'query_type': 'Search by account type or keywords'
            },
            {
                'scenario': 'Comprehensive context building',
                'expected_calls': 2-3,
                'query_type': 'Multiple queries for pattern analysis'
            }
        ]
        
        return self.evaluate_query_efficiency(query_patterns)
    
    def test_tool_data_format(self):
        """
        Test: Is ground truth data properly structured for Eliza?
        Target: 100% of queries return parseable, complete data
        """
        format_checks = {
            'schema_compliance': {
                'target': '100%',
                'check': 'All required fields present'
            },
            'data_completeness': {
                'target': '≥ 95%',
                'check': 'No null/empty critical fields'
            },
            'metadata_richness': {
                'target': '≥ 80%',
                'check': 'Includes override reason, validation count, etc.'
            }
        }
        
        return self.verify_data_format(format_checks)
    
    def test_tool_error_handling(self):
        """
        Test: How does system handle tool failures?
        Target: Graceful degradation, not system failure
        """
        error_scenarios = [
            {
                'error': 'Tool timeout',
                'expected_behavior': 'Eliza falls back to base knowledge',
                'user_impact': 'Minimal - may get lower confidence suggestions'
            },
            {
                'error': 'Malformed query',
                'expected_behavior': 'Error logged, query retried or skipped',
                'user_impact': 'None - transparent to user'
            },
            {
                'error': 'Empty ground truth',
                'expected_behavior': 'Eliza proceeds without ground truth',
                'user_impact': 'None - normal for new patterns'
            }
        ]
        
        return self.test_error_scenarios(error_scenarios)

# Tool Integration Benchmarks
tool_integration_benchmarks = {
    'availability': {
        'target': '≥ 99.9% uptime',
        'critical': True
    },
    'response_time': {
        'target': '< 2 seconds',
        'critical': True
    },
    'query_efficiency': {
        'target': '< 3 calls per mapping',
        'critical': False
    },
    'data_quality': {
        'target': '100% complete and valid',
        'critical': True
    },
    'error_resilience': {
        'target': '100% graceful handling',
        'critical': True
    }
}
```

---

## 5. End-to-End Feedback Loop Evaluation

### 5.1 Complete Cycle Testing

```python
class FeedbackLoopEvaluator:
    """
    Evaluate the complete feedback loop from Eliza suggestion to learning
    """
    
    def test_complete_feedback_cycle(self):
        """
        Test: Complete cycle from suggestion through override to learning
        Target: Observable improvement within 5 cycles
        """
        cycle_test = {
            'iterations': [
                {
                    'cycle': 1,
                    'eliza_suggests': 'Mapping A',
                    'user_overrides_to': 'Mapping B',
                    'provides_reason': 'We always use B for this type',
                    'ground_truth_updated': True
                },
                {
                    'cycle': 2,
                    'similar_request': True,
                    'eliza_should_suggest': 'Mapping B',
                    'confidence_should_be': '>80%',
                    'reasoning_should_reference': 'Previous feedback'
                },
                {
                    'cycle': 3,
                    'slightly_different_request': True,
                    'eliza_should_apply_pattern': True,
                    'confidence': '70-85%'
                },
                {
                    'cycle': 4,
                    'user_validates': 'Cycle 3 suggestion',
                    'ground_truth_reliability_increases': True
                },
                {
                    'cycle': 5,
                    'eliza_suggests': 'Original pattern',
                    'confidence_should_be': '>90%',
                    'override_rate_should_be': '<10%'
                }
            ],
            'success_criteria': {
                'learning_visible': 'By cycle 2',
                'pattern_application': 'By cycle 3',
                'high_confidence': 'By cycle 5',
                'low_override_rate': '<10% by cycle 5'
            }
        }
        
        return self.run_cycle_test(cycle_test)
    
    def test_multi_user_feedback_aggregation(self):
        """
        Test: How does system handle feedback from multiple users?
        Target: Prioritize consensus, flag conflicts
        """
        multi_user_scenarios = [
            {
                'scenario': 'Consensus feedback',
                'users': [
                    {'user': 'A', 'override': 'Target X'},
                    {'user': 'B', 'override': 'Target X'},
                    {'user': 'C', 'override': 'Target X'}
                ],
                'expected': {
                    'ground_truth': 'Target X',
                    'confidence': 'High',
                    'reliability_score': '>95%'
                }
            },
            {
                'scenario': 'Conflicting feedback',
                'users': [
                    {'user': 'A', 'override': 'Target X'},
                    {'user': 'B', 'override': 'Target Y'},
                    {'user': 'C', 'override': 'Target X'}
                ],
                'expected': {
                    'ground_truth': 'Target X (majority)',
                    'confidence': 'Medium',
                    'flag_for_review': True,
                    'reliability_score': '70-80%'
                }
            },
            {
                'scenario': 'Authority-based feedback',
                'users': [
                    {'user': 'Staff', 'override': 'Target X'},
                    {'user': 'Manager', 'override': 'Target Y', 'authority': 'high'}
                ],
                'expected': {
                    'ground_truth': 'Target Y (higher authority)',
                    'confidence': 'High',
                    'previous_mapping_flagged': True
                }
            }
        ]
        
        return self.test_aggregation_logic(multi_user_scenarios)
    
    def test_feedback_impact_measurement(self):
        """
        Test: Can we measure the impact of feedback on accuracy?
        Target: Demonstrate ≥ 15% accuracy improvement over time
        """
        impact_metrics = {
            'baseline_accuracy': {
                'measurement': 'Accuracy before ground truth collection',
                'typical_value': '70-75%'
            },
            'accuracy_after_100_feedbacks': {
                'measurement': 'Accuracy with 100 ground truth entries',
                'target': '≥ 80%',
                'improvement': '≥ 10%'
            },
            'accuracy_after_500_feedbacks': {
                'measurement': 'Accuracy with 500 ground truth entries',
                'target': '≥ 85%',
                'improvement': '≥ 15%'
            },
            'accuracy_plateau': {
                'measurement': 'Max accuracy with mature ground truth',
                'target': '≥ 90%',
                'expected_entries': '1000-2000'
            }
        }
        
        return self.measure_accuracy_improvement(impact_metrics)

# Feedback Loop Benchmarks
feedback_loop_benchmarks = {
    'learning_speed': {
        'target': 'Observable improvement by cycle 2',
        'critical': True
    },
    'accuracy_improvement': {
        'target': '≥ 15% improvement after 500 feedbacks',
        'critical': True
    },
    'consensus_handling': {
        'target': '100% correct aggregation',
        'critical': True
    },
    'conflict_detection': {
        'target': '100% conflicts flagged',
        'critical': True
    }
}
```

---

## 6. System Performance Evaluation

### 6.1 Performance Under Load

```python
class SystemPerformanceEvaluator:
    """
    Evaluate system performance with growing ground truth collection
    """
    
    def test_ground_truth_scaling(self):
        """
        Test: Performance as ground truth collection grows
        Target: < 3 seconds response time with 10,000 entries
        """
        scaling_tests = [
            {
                'ground_truth_size': 100,
                'expected_query_time': '< 0.5 seconds',
                'expected_eliza_response': '< 2 seconds'
            },
            {
                'ground_truth_size': 1000,
                'expected_query_time': '< 1 second',
                'expected_eliza_response': '< 3 seconds'
            },
            {
                'ground_truth_size': 5000,
                'expected_query_time': '< 2 seconds',
                'expected_eliza_response': '< 4 seconds'
            },
            {
                'ground_truth_size': 10000,
                'expected_query_time': '< 3 seconds',
                'expected_eliza_response': '< 5 seconds'
            }
        ]
        
        return self.test_scaling_performance(scaling_tests)
    
    def test_concurrent_feedback(self):
        """
        Test: System handles concurrent user feedback
        Target: No data corruption or race conditions
        """
        concurrency_tests = {
            'simultaneous_overrides': {
                'setup': '5 users override different mappings simultaneously',
                'expected': 'All overrides correctly recorded',
                'no_data_loss': True
            },
            'same_mapping_overrides': {
                'setup': '2 users override same mapping at same time',
                'expected': 'Last write wins with notification to first user',
                'conflict_logged': True
            },
            'ground_truth_read_write': {
                'setup': 'Eliza reads while user writes',
                'expected': 'Consistent data, no errors',
                'transaction_isolation': True
            }
        }
        
        return self.test_concurrency(concurrency_tests)
    
    def test_feedback_ui_performance(self):
        """
        Test: UI responsiveness with large mapping sets
        Target: < 2 seconds load time for 100 mappings
        """
        ui_performance = {
            'grid_load_time': {
                '100_mappings': '< 2 seconds',
                '500_mappings': '< 5 seconds',
                '1000_mappings': '< 10 seconds or pagination'
            },
            'override_action_time': {
                'target': '< 1 second',
                'includes': 'UI update + DB write + ground truth update'
            },
            'search_filter_time': {
                'target': '< 0.5 seconds',
                'for_dataset': 'Up to 1000 mappings'
            }
        }
        
        return self.measure_ui_performance(ui_performance)

# Performance Benchmarks
performance_benchmarks = {
    'ground_truth_query_time': {
        'target': '< 2 seconds for 5000 entries',
        'critical': True
    },
    'eliza_response_time': {
        'target': '< 5 seconds including ground truth access',
        'critical': True
