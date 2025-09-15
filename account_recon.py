# ===========================
# Accounting System Conversion Analysis Pipeline
# User Query → Intent Analysis → Entity Extraction → Query Generation → Execution → Insight Generation → Natural Language Response
# ===========================

import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import re
from decimal import Decimal
import pandas as pd
import numpy as np

# External dependencies
from pymongo import MongoClient
from pymongo.collection import Collection
import openai
from anthropic import Anthropic
from fastapi import FastAPI, WebSocket, HTTPException
from pydantic import BaseModel

# ===========================
# Data Models for Accounting Analysis
# ===========================

class AccountingEntityType(Enum):
    ACCOUNT = "account"
    TRANSACTION = "transaction"
    JOURNAL_ENTRY = "journal_entry"
    BALANCE = "balance"
    PERIOD = "period"
    SYSTEM = "system"
    DIFFERENCE = "difference"
    RECONCILIATION = "reconciliation"

class AnalysisIntent(Enum):
    COMPARISON = "comparison"
    RECONCILIATION = "reconciliation"
    MIGRATION_STATUS = "migration_status"
    DATA_QUALITY = "data_quality"
    BALANCE_VERIFICATION = "balance_verification"
    DISCREPANCY_ANALYSIS = "discrepancy_analysis"
    AUDIT_TRAIL = "audit_trail"
    REPORTING = "reporting"

@dataclass
class ExtractedEntity:
    type: AccountingEntityType
    value: str
    confidence: float
    context: str

@dataclass
class ParsedIntent:
    intent: AnalysisIntent
    entities: List[ExtractedEntity]
    time_period: Optional[Dict[str, Any]]
    comparison_systems: List[str]
    specific_accounts: List[str]
    confidence: float
    original_query: str

@dataclass
class AccountingInsight:
    type: str
    title: str
    description: str
    severity: str  # 'critical', 'high', 'medium', 'low'
    financial_impact: Optional[Decimal]
    affected_accounts: List[str]
    recommendations: List[str]
    confidence: float

@dataclass
class MongoQuery:
    collection: str
    pipeline: List[Dict[str, Any]]
    explanation: str

# ===========================
# 1. Intent Analysis & Entity Extraction
# ===========================

class AccountingIntentAnalyzer:
    def __init__(self, openai_client: openai.OpenAI):
        self.openai_client = openai_client
        
        # Define accounting domain patterns
        self.account_patterns = {
            'revenue': r'\b(revenue|sales|income|earnings)\b',
            'expense': r'\b(expense|cost|expenditure|spending)\b',
            'asset': r'\b(asset|cash|inventory|receivable)\b',
            'liability': r'\b(liability|payable|debt|loan)\b',
            'equity': r'\b(equity|capital|retained earnings)\b'
        }
        
        self.time_patterns = {
            'month': r'\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{4})\b',
            'quarter': r'\b(q1|q2|q3|q4|quarter)\b',
            'year': r'\b(20\d{2}|fy\d{4})\b',
            'period': r'\b(last month|this month|last quarter|ytd|year to date)\b'
        }
    
    async def analyze_query(self, user_query: str) -> ParsedIntent:
        """Analyze user query for accounting-specific intent and entities"""
        
        # First, use LLM for sophisticated intent analysis
        llm_analysis = await self._llm_intent_analysis(user_query)
        
        # Then, extract accounting-specific entities
        entities = self._extract_accounting_entities(user_query)
        
        # Extract time period information
        time_period = self._extract_time_period(user_query)
        
        # Identify systems being compared
        comparison_systems = self._identify_comparison_systems(user_query)
        
        # Extract specific account references
        specific_accounts = self._extract_account_references(user_query)
        
        return ParsedIntent(
            intent=llm_analysis['intent'],
            entities=entities,
            time_period=time_period,
            comparison_systems=comparison_systems,
            specific_accounts=specific_accounts,
            confidence=llm_analysis['confidence'],
            original_query=user_query
        )
    
    async def _llm_intent_analysis(self, query: str) -> Dict[str, Any]:
        """Use LLM to understand accounting intent"""
        
        prompt = f"""
Analyze this accounting system conversion query and extract the intent:

Query: "{query}"

Context: This is about analyzing data conversion between two accounting systems (legacy_system and new_system).

Available intents:
- COMPARISON: Compare data between two systems
- RECONCILIATION: Find and resolve differences
- MIGRATION_STATUS: Check progress of data migration
- DATA_QUALITY: Analyze data integrity and quality
- BALANCE_VERIFICATION: Verify account balances match
- DISCREPANCY_ANALYSIS: Analyze specific discrepancies
- AUDIT_TRAIL: Track changes and modifications
- REPORTING: Generate financial reports

Respond in JSON format:
{{
    "intent": "PRIMARY_INTENT",
    "secondary_intents": ["SECONDARY_INTENT1", "SECONDARY_INTENT2"],
    "confidence": 0.0-1.0,
    "reasoning": "Why this intent was chosen",
    "urgency": "low|medium|high|critical"
}}
"""
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        try:
            result = json.loads(response.choices[0].message.content)
            return {
                'intent': AnalysisIntent(result['intent'].lower()),
                'confidence': result['confidence'],
                'secondary_intents': result.get('secondary_intents', []),
                'urgency': result.get('urgency', 'medium')
            }
        except (json.JSONDecodeError, KeyError):
            # Fallback to pattern matching
            return self._fallback_intent_detection(query)
    
    def _extract_accounting_entities(self, query: str) -> List[ExtractedEntity]:
        """Extract accounting-specific entities using pattern matching"""
        entities = []
        query_lower = query.lower()
        
        # Extract account types
        for account_type, pattern in self.account_patterns.items():
            matches = re.finditer(pattern, query_lower, re.IGNORECASE)
            for match in matches:
                entities.append(ExtractedEntity(
                    type=AccountingEntityType.ACCOUNT,
                    value=account_type,
                    confidence=0.8,
                    context=match.group()
                ))
        
        # Extract account codes (e.g., "account 1000", "GL 4500")
        account_code_pattern = r'\b(account|gl|code)\s*[:\-]?\s*(\d{3,5})\b'
        matches = re.finditer(account_code_pattern, query_lower, re.IGNORECASE)
        for match in matches:
            entities.append(ExtractedEntity(
                type=AccountingEntityType.ACCOUNT,
                value=match.group(2),
                confidence=0.9,
                context=match.group()
            ))
        
        # Extract transaction IDs
        transaction_pattern = r'\b(transaction|trans|txn)\s*[:\-]?\s*([a-z0-9\-]+)\b'
        matches = re.finditer(transaction_pattern, query_lower, re.IGNORECASE)
        for match in matches:
            entities.append(ExtractedEntity(
                type=AccountingEntityType.TRANSACTION,
                value=match.group(2),
                confidence=0.85,
                context=match.group()
            ))
        
        # Extract monetary amounts
        amount_pattern = r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd|k|million|m)?'
        matches = re.finditer(amount_pattern, query_lower, re.IGNORECASE)
        for match in matches:
            entities.append(ExtractedEntity(
                type=AccountingEntityType.BALANCE,
                value=match.group(1),
                confidence=0.7,
                context=match.group()
            ))
        
        return entities
    
    def _extract_time_period(self, query: str) -> Optional[Dict[str, Any]]:
        """Extract time period information"""
        query_lower = query.lower()
        
        # Look for specific dates
        date_pattern = r'\b(\d{1,2})/(\d{1,2})/(\d{4})\b'
        date_match = re.search(date_pattern, query)
        if date_match:
            return {
                'type': 'specific_date',
                'date': f"{date_match.group(3)}-{date_match.group(1).zfill(2)}-{date_match.group(2).zfill(2)}"
            }
        
        # Look for relative periods
        if 'last month' in query_lower:
            last_month = datetime.now().replace(day=1) - timedelta(days=1)
            return {
                'type': 'month',
                'year': last_month.year,
                'month': last_month.month
            }
        
        if 'this month' in query_lower:
            now = datetime.now()
            return {
                'type': 'month',
                'year': now.year,
                'month': now.month
            }
        
        # Look for quarters
        quarter_match = re.search(r'\b(q[1-4])\s+(\d{4})\b', query_lower)
        if quarter_match:
            quarter_num = int(quarter_match.group(1)[1])
            year = int(quarter_match.group(2))
            return {
                'type': 'quarter',
                'year': year,
                'quarter': quarter_num
            }
        
        # Look for years
        year_match = re.search(r'\b(20\d{2})\b', query)
        if year_match:
            return {
                'type': 'year',
                'year': int(year_match.group(1))
            }
        
        return None
    
    def _identify_comparison_systems(self, query: str) -> List[str]:
        """Identify which accounting systems are being referenced"""
        systems = []
        query_lower = query.lower()
        
        system_keywords = {
            'legacy_system': ['legacy', 'old system', 'previous system', 'source system'],
            'new_system': ['new system', 'target system', 'destination', 'migrated'],
            'both_systems': ['both systems', 'compare systems', 'between systems']
        }
        
        for system, keywords in system_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                systems.append(system)
        
        # Default to both if no specific system mentioned
        if not systems:
            systems = ['legacy_system', 'new_system']
        
        return systems
    
    def _extract_account_references(self, query: str) -> List[str]:
        """Extract specific account numbers or names"""
        accounts = []
        
        # Account numbers (3-5 digits)
        account_numbers = re.findall(r'\b\d{3,5}\b', query)
        accounts.extend(account_numbers)
        
        # Account names in quotes
        quoted_accounts = re.findall(r'"([^"]+)"', query)
        accounts.extend(quoted_accounts)
        
        return list(set(accounts))  # Remove duplicates

# ===========================
# 2. Query Generation for Accounting Data
# ===========================

class AccountingQueryGenerator:
    def __init__(self, db_client: MongoClient):
        self.db_client = db_client
        self.db = db_client.accounting_conversion
        
        # Define collection schemas
        self.collections_schema = {
            'legacy_accounts': {
                'fields': ['account_code', 'account_name', 'account_type', 'balance', 'currency', 'last_updated'],
                'description': 'Chart of accounts from legacy system'
            },
            'new_accounts': {
                'fields': ['account_code', 'account_name', 'account_type', 'balance', 'currency', 'last_updated', 'mapped_from_legacy'],
                'description': 'Chart of accounts in new system'
            },
            'legacy_transactions': {
                'fields': ['transaction_id', 'date', 'account_code', 'debit', 'credit', 'description', 'reference', 'created_by'],
                'description': 'Transaction details from legacy system'
            },
            'new_transactions': {
                'fields': ['transaction_id', 'date', 'account_code', 'debit', 'credit', 'description', 'reference', 'created_by', 'migrated_from'],
                'description': 'Transaction details in new system'
            },
            'migration_log': {
                'fields': ['migration_id', 'source_collection', 'target_collection', 'record_count', 'success_count', 'error_count', 'timestamp', 'status'],
                'description': 'Log of migration activities'
            },
            'reconciliation_results': {
                'fields': ['reconciliation_id', 'account_code', 'legacy_balance', 'new_balance', 'difference', 'status', 'notes', 'date'],
                'description': 'Results of balance reconciliation'
            }
        }
    
    async def generate_queries(self, parsed_intent: ParsedIntent) -> List[MongoQuery]:
        """Generate MongoDB queries based on parsed intent"""
        
        queries = []
        
        if parsed_intent.intent == AnalysisIntent.COMPARISON:
            queries.extend(await self._generate_comparison_queries(parsed_intent))
        elif parsed_intent.intent == AnalysisIntent.RECONCILIATION:
            queries.extend(await self._generate_reconciliation_queries(parsed_intent))
        elif parsed_intent.intent == AnalysisIntent.MIGRATION_STATUS:
            queries.extend(await self._generate_migration_status_queries(parsed_intent))
        elif parsed_intent.intent == AnalysisIntent.DATA_QUALITY:
            queries.extend(await self._generate_data_quality_queries(parsed_intent))
        elif parsed_intent.intent == AnalysisIntent.BALANCE_VERIFICATION:
            queries.extend(await self._generate_balance_verification_queries(parsed_intent))
        elif parsed_intent.intent == AnalysisIntent.DISCREPANCY_ANALYSIS:
            queries.extend(await self._generate_discrepancy_queries(parsed_intent))
        
        return queries
    
    async def _generate_comparison_queries(self, intent: ParsedIntent) -> List[MongoQuery]:
        """Generate queries for system comparison"""
        queries = []
        
        # Compare account counts
        queries.append(MongoQuery(
            collection='legacy_accounts',
            pipeline=[
                {'$group': {'_id': '$account_type', 'count': {'$sum': 1}, 'total_balance': {'$sum': '$balance'}}},
                {'$sort': {'_id': 1}}
            ],
            explanation='Count and sum of accounts by type in legacy system'
        ))
        
        queries.append(MongoQuery(
            collection='new_accounts',
            pipeline=[
                {'$group': {'_id': '$account_type', 'count': {'$sum': 1}, 'total_balance': {'$sum': '$balance'}}},
                {'$sort': {'_id': 1}}
            ],
            explanation='Count and sum of accounts by type in new system'
        ))
        
        # Compare transaction volumes
        date_filter = self._build_date_filter(intent.time_period)
        if date_filter:
            queries.append(MongoQuery(
                collection='legacy_transactions',
                pipeline=[
                    {'$match': date_filter},
                    {'$group': {
                        '_id': {'$dateToString': {'format': '%Y-%m', 'date': '$date'}},
                        'transaction_count': {'$sum': 1},
                        'total_debits': {'$sum': '$debit'},
                        'total_credits': {'$sum': '$credit'}
                    }},
                    {'$sort': {'_id': 1}}
                ],
                explanation='Monthly transaction summary for legacy system'
            ))
        
        return queries
    
    async def _generate_reconciliation_queries(self, intent: ParsedIntent) -> List[MongoQuery]:
        """Generate queries for reconciliation analysis"""
        queries = []
        
        # Get reconciliation results
        queries.append(MongoQuery(
            collection='reconciliation_results',
            pipeline=[
                {'$match': {'status': {'$ne': 'matched'}}},
                {'$sort': {'difference': -1}},
                {'$limit': 100}
            ],
            explanation='Top 100 accounts with reconciliation differences'
        ))
        
        # Summarize reconciliation status
        queries.append(MongoQuery(
            collection='reconciliation_results',
            pipeline=[
                {'$group': {
                    '_id': '$status',
                    'count': {'$sum': 1},
                    'total_difference': {'$sum': {'$abs': '$difference'}}
                }},
                {'$sort': {'total_difference': -1}}
            ],
            explanation='Summary of reconciliation status by type'
        ))
        
        return queries
    
    async def _generate_balance_verification_queries(self, intent: ParsedIntent) -> List[MongoQuery]:
        """Generate queries for balance verification"""
        queries = []
        
        # Account-level balance comparison
        account_filter = {}
        if intent.specific_accounts:
            account_filter = {'account_code': {'$in': intent.specific_accounts}}
        
        queries.append(MongoQuery(
            collection='legacy_accounts',
            pipeline=[
                {'$match': account_filter},
                {'$project': {
                    'account_code': 1,
                    'account_name': 1,
                    'balance': 1,
                    'account_type': 1
                }},
                {'$sort': {'account_code': 1}}
            ],
            explanation='Account balances from legacy system'
        ))
        
        queries.append(MongoQuery(
            collection='new_accounts',
            pipeline=[
                {'$match': account_filter},
                {'$project': {
                    'account_code': 1,
                    'account_name': 1,
                    'balance': 1,
                    'account_type': 1,
                    'mapped_from_legacy': 1
                }},
                {'$sort': {'account_code': 1}}
            ],
            explanation='Account balances from new system'
        ))
        
        return queries
    
    def _build_date_filter(self, time_period: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Build MongoDB date filter from time period"""
        if not time_period:
            return {}
        
        if time_period['type'] == 'month':
            start_date = datetime(time_period['year'], time_period['month'], 1)
            if time_period['month'] == 12:
                end_date = datetime(time_period['year'] + 1, 1, 1)
            else:
                end_date = datetime(time_period['year'], time_period['month'] + 1, 1)
            
            return {'date': {'$gte': start_date, '$lt': end_date}}
        
        elif time_period['type'] == 'year':
            start_date = datetime(time_period['year'], 1, 1)
            end_date = datetime(time_period['year'] + 1, 1, 1)
            return {'date': {'$gte': start_date, '$lt': end_date}}
        
        elif time_period['type'] == 'quarter':
            quarter = time_period['quarter']
            year = time_period['year']
            start_month = (quarter - 1) * 3 + 1
            end_month = quarter * 3 + 1
            
            start_date = datetime(year, start_month, 1)
            if end_month > 12:
                end_date = datetime(year + 1, end_month - 12, 1)
            else:
                end_date = datetime(year, end_month, 1)
            
            return {'date': {'$gte': start_date, '$lt': end_date}}
        
        return {}

# ===========================
# 3. Query Execution Engine
# ===========================

class AccountingQueryExecutor:
    def __init__(self, db_client: MongoClient):
        self.db_client = db_client
        self.db = db_client.accounting_conversion
    
    async def execute_queries(self, queries: List[MongoQuery]) -> List[Dict[str, Any]]:
        """Execute MongoDB queries and return results"""
        results = []
        
        for query in queries:
            try:
                collection = self.db[query.collection]
                
                if query.pipeline:
                    # Aggregation pipeline
                    cursor = collection.aggregate(query.pipeline)
                    data = list(cursor)
                else:
                    # Simple find query
                    cursor = collection.find()
                    data = list(cursor)
                
                results.append({
                    'collection': query.collection,
                    'explanation': query.explanation,
                    'data': data,
                    'count': len(data),
                    'success': True
                })
                
            except Exception as e:
                results.append({
                    'collection': query.collection,
                    'explanation': query.explanation,
                    'data': [],
                    'count': 0,
                    'success': False,
                    'error': str(e)
                })
        
        return results

# ===========================
# 4. Insight Generation Engine
# ===========================

class AccountingInsightGenerator:
    def __init__(self, openai_client: openai.OpenAI):
        self.openai_client = openai_client
    
    async def generate_insights(
        self, 
        query_results: List[Dict[str, Any]], 
        parsed_intent: ParsedIntent
    ) -> List[AccountingInsight]:
        """Generate accounting insights from query results"""
        
        insights = []
        
        # Analyze each result set
        for result in query_results:
            if not result['success'] or not result['data']:
                continue
            
            collection_insights = await self._analyze_collection_data(
                result, parsed_intent
            )
            insights.extend(collection_insights)
        
        # Generate cross-collection insights
        cross_insights = await self._generate_cross_collection_insights(
            query_results, parsed_intent
        )
        insights.extend(cross_insights)
        
        # Use LLM for sophisticated insight generation
        llm_insights = await self._generate_llm_insights(query_results, parsed_intent)
        insights.extend(llm_insights)
        
        return insights
    
    async def _analyze_collection_data(
        self, 
        result: Dict[str, Any], 
        intent: ParsedIntent
    ) -> List[AccountingInsight]:
        """Analyze individual collection data for insights"""
        insights = []
        data = result['data']
        collection = result['collection']
        
        if 'reconciliation' in collection:
            insights.extend(self._analyze_reconciliation_data(data))
        elif 'accounts' in collection:
            insights.extend(self._analyze_account_data(data, collection))
        elif 'transactions' in collection:
            insights.extend(self._analyze_transaction_data(data, collection))
        elif 'migration' in collection:
            insights.extend(self._analyze_migration_data(data))
        
        return insights
    
    def _analyze_reconciliation_data(self, data: List[Dict]) -> List[AccountingInsight]:
        """Analyze reconciliation results for insights"""
        insights = []
        
        if not data:
            return insights
        
        # Calculate total differences
        total_difference = sum(abs(item.get('difference', 0)) for item in data)
        unmatched_count = len([item for item in data if item.get('status') != 'matched'])
        
        if total_difference > 1000:  # Threshold for material difference
            insights.append(AccountingInsight(
                type='reconciliation_variance',
                title='Material Reconciliation Differences Detected',
                description=f'Total reconciliation differences of ${total_difference:,.2f} found across {unmatched_count} accounts',
                severity='high' if total_difference > 10000 else 'medium',
                financial_impact=Decimal(str(total_difference)),
                affected_accounts=[item.get('account_code', '') for item in data[:10]],
                recommendations=[
                    'Review mapping configuration for affected accounts',
                    'Investigate data conversion rules',
                    'Validate currency conversion rates',
                    'Check for timing differences in transaction posting'
                ],
                confidence=0.9
            ))
        
        # Analyze patterns in differences
        account_types_with_issues = {}
        for item in data:
            account_code = item.get('account_code', '')
            if account_code:
                # Assume account type from code pattern (first digit)
                account_type = self._infer_account_type(account_code)
                if account_type not in account_types_with_issues:
                    account_types_with_issues[account_type] = 0
                account_types_with_issues[account_type] += 1
        
        if account_types_with_issues:
            most_affected = max(account_types_with_issues, key=account_types_with_issues.get)
            insights.append(AccountingInsight(
                type='pattern_analysis',
                title=f'{most_affected.title()} Accounts Most Affected',
                description=f'{account_types_with_issues[most_affected]} {most_affected} accounts have reconciliation issues',
                severity='medium',
                financial_impact=None,
                affected_accounts=[],
                recommendations=[
                    f'Focus reconciliation efforts on {most_affected} accounts',
                    'Review mapping rules for this account type',
                    'Validate business logic for account classification'
                ],
                confidence=0.75
            ))
        
        return insights
    
    def _analyze_account_data(self, data: List[Dict], collection: str) -> List[AccountingInsight]:
        """Analyze account balance data"""
        insights = []
        
        if not data:
            return insights
        
        # Analyze balance distribution
        balances = [item.get('balance', 0) for item in data if item.get('balance') is not None]
        if balances:
            total_balance = sum(balances)
            avg_balance = np.mean(balances)
            std_balance = np.std(balances)
            
            # Identify outliers (balances > 3 standard deviations)
            outliers = [b for b in balances if abs(b - avg_balance) > 3 * std_balance]
            
            if outliers:
                insights.append(AccountingInsight(
                    type='balance_outliers',
                    title='Unusual Account Balances Detected',
                    description=f'Found {len(outliers)} accounts with balances significantly different from average',
                    severity='medium',
                    financial_impact=Decimal(str(sum(outliers))),
                    affected_accounts=[],
                    recommendations=[
                        'Review outlier account balances for accuracy',
                        'Verify account classifications',
                        'Check for data entry errors'
                    ],
                    confidence=0.8
                ))
        
        return insights
    
    async def _generate_llm_insights(
        self, 
        query_results: List[Dict[str, Any]], 
        intent: ParsedIntent
    ) -> List[AccountingInsight]:
        """Use LLM to generate sophisticated insights"""
        
        # Prepare data summary for LLM
        data_summary = self._prepare_data_summary(query_results)
        
        prompt = f"""
Analyze this accounting system conversion data and provide insights:

Original Query: "{intent.original_query}"
Intent: {intent.intent.value}

Data Summary:
{json.dumps(data_summary, indent=2, default=str)}

Focus on:
1. Data quality issues between systems
2. Financial discrepancies that need attention
3. Migration risks or concerns
4. Audit findings
5. Recommendations for resolution

Provide insights in this JSON format:
{{
    "insights": [
        {{
            "type": "insight_category",
            "title": "Brief insight title",
            "description": "Detailed explanation",
            "severity": "critical|high|medium|low",
            "recommendations": ["action 1", "action 2"],
            "confidence": 0.0-1.0
        }}
    ]
}}
"""
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            
            result = json.loads(response.choices[0].message.content)
            
            llm_insights = []
            for insight_data in result.get('insights', []):
                llm_insights.append(AccountingInsight(
                    type=insight_data.get('type', 'general'),
                    title=insight_data.get('title', ''),
                    description=insight_data.get('description', ''),
                    severity=insight_data.get('severity', 'medium'),
                    financial_impact=None,
                    affected_accounts=[],
                    recommendations=insight_data.get('recommendations', []),
                    confidence=insight_data.get('confidence', 0.7)
                ))
            
            return llm_insights
            
        except Exception as e:
            print(f"LLM insight generation failed: {e}")
            return []
    
    def _prepare_data_summary(self, query_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Prepare a summary of query results for LLM analysis"""
        summary = {
            'total_collections_analyzed': len(query_results),
            'successful_queries': len([r for r in query_results if r['success']]),
            'collections': {}
        }
        
        for result in query_results:
            if result['success'] and result['data']:
                collection = result['collection']
                data = result['data']
                
                summary['collections'][collection] = {
                    'record_count': len(data),
                    'sample_data': data[:3] if data else [],  # First 3 records
                    'explanation': result['explanation']
                }
        
        return summary
    
    def _infer_account_type(self, account_code: str) -> str:
        """Infer account type from account code pattern"""
        if not account_code or not account_code[0].isdigit():
            return 'unknown'
        
        first_digit = account_code[0]
        account_type_map = {
            '1': 'assets',
            '2': 'liabilities', 
            '3': 'equity',
            '4': 'revenue',
            '5': 'expenses',
            '6': 'expenses',
            '7': 'other_income',
            '8': 'other_expenses',
            '9': 'cost_of_sales'
        }
        
        return account_type_map.get(first_digit, 'unknown')
    
    async def _generate_cross_collection_insights(
        self, 
        query_results: List[Dict[str, Any]], 
        intent: ParsedIntent
    ) -> List[AccountingInsight]:
        """Generate insights by comparing data across collections"""
        insights = []
        
        # Find legacy and new system data
        legacy_accounts = None
        new_accounts = None
        
        for result in query_results:
            if result['collection'] == 'legacy_accounts' and result['success']:
                legacy_accounts = result['data']
            elif result['collection'] == 'new_accounts' and result['success']:
                new_accounts = result['data']
        
        # Compare account counts and balances
        if legacy_accounts and new_accounts:
            legacy_total = sum(acc.get('balance', 0) for acc in legacy_accounts)
            new_total = sum(acc.get('balance', 0) for acc in new_accounts)
            difference = abs(legacy_total - new_total)
            
            if difference > 100:  # Material difference threshold
                insights.append(AccountingInsight(
                    type='system_balance_variance',
                    title='Total Balance Variance Between Systems',
                    description=f'Legacy system total: ${legacy_total:,.2f}, New system total: ${new_total:,.2f}, Difference: ${difference:,.2f}',
                    severity='critical' if difference > 10000 else 'high',
                    financial_impact=Decimal(str(difference)),
                    affected_accounts=[],
                    recommendations=[
                        'Perform detailed account-by-account reconciliation',
                        'Review currency conversion settings',
                        'Check for missing or duplicate account mappings',
                        'Validate trial balance before finalizing migration'
                    ],
                    confidence=0.95
                ))
            
            # Compare account counts
            legacy_count = len(legacy_accounts)
            new_count = len(new_accounts)
            
            if legacy_count != new_count:
                insights.append(AccountingInsight(
                    type='account_count_mismatch',
                    title='Account Count Mismatch Between Systems',
                    description=f'Legacy system has {legacy_count} accounts, new system has {new_count} accounts',
                    severity='medium',
                    financial_impact=None,
                    affected_accounts=[],
                    recommendations=[
                        'Identify missing or extra accounts',
                        'Review account consolidation rules',
                        'Verify account mapping completeness'
                    ],
                    confidence=0.9
                ))
        
        return insights

# ===========================
# 5. Natural Language Response Generator
# ===========================

class AccountingResponseGenerator:
    def __init__(self, openai_client: openai.OpenAI):
        self.openai_client = openai_client
    
    async def generate_response(
        self,
        original_query: str,
        parsed_intent: ParsedIntent,
        insights: List[AccountingInsight],
        query_results: List[Dict[str, Any]]
    ) -> str:
        """Generate natural language response with insights and recommendations"""
        
        # Prepare context for LLM
        context = self._prepare_response_context(original_query, parsed_intent, insights, query_results)
        
        prompt = f"""
Generate a professional, comprehensive response to this accounting system conversion query.

Original Query: "{original_query}"

Context:
{json.dumps(context, indent=2, default=str)}

Instructions:
1. Start with a direct answer to the user's question
2. Highlight the most critical findings first
3. Use specific numbers and financial amounts
4. Provide clear, actionable recommendations
5. Include confidence levels where relevant
6. Use professional accounting terminology
7. Structure response with clear sections
8. End with next steps

Format as professional business communication with proper formatting.
"""
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    
    def _prepare_response_context(
        self,
        original_query: str,
        parsed_intent: ParsedIntent,
        insights: List[AccountingInsight],
        query_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Prepare context for response generation"""
        
        # Summarize insights by severity
        insights_by_severity = {'critical': [], 'high': [], 'medium': [], 'low': []}
        total_financial_impact = Decimal('0')
        
        for insight in insights:
            insights_by_severity[insight.severity].append({
                'title': insight.title,
                'description': insight.description,
                'recommendations': insight.recommendations,
                'confidence': insight.confidence
            })
            
            if insight.financial_impact:
                total_financial_impact += insight.financial_impact
        
        # Summarize data findings
        data_summary = {
            'collections_analyzed': len(query_results),
            'successful_queries': len([r for r in query_results if r['success']]),
            'total_records': sum(r['count'] for r in query_results if r['success'])
        }
        
        return {
            'intent': parsed_intent.intent.value,
            'time_period': parsed_intent.time_period,
            'insights_by_severity': insights_by_severity,
            'total_financial_impact': float(total_financial_impact),
            'data_summary': data_summary,
            'entities_found': [{'type': e.type.value, 'value': e.value} for e in parsed_intent.entities]
        }

# ===========================
# 6. Dynamic Dashboard Generator
# ===========================

@dataclass
class DashboardWidget:
    widget_id: str
    title: str
    type: str  # 'chart', 'metric', 'table', 'alert'
    data: Dict[str, Any]
    config: Dict[str, Any]
    priority: int  # 1-10, higher = more important

class AccountingDashboardGenerator:
    def __init__(self):
        pass
    
    async def generate_dashboard(
        self,
        parsed_intent: ParsedIntent,
        insights: List[AccountingInsight],
        query_results: List[Dict[str, Any]]
    ) -> List[DashboardWidget]:
        """Generate dynamic dashboard widgets based on analysis"""
        
        widgets = []
        
        # Always include summary metrics
        widgets.append(self._create_summary_metrics_widget(insights, query_results))
        
        # Add intent-specific widgets
        if parsed_intent.intent == AnalysisIntent.RECONCILIATION:
            widgets.extend(self._create_reconciliation_widgets(query_results))
        elif parsed_intent.intent == AnalysisIntent.COMPARISON:
            widgets.extend(self._create_comparison_widgets(query_results))
        elif parsed_intent.intent == AnalysisIntent.BALANCE_VERIFICATION:
            widgets.extend(self._create_balance_widgets(query_results))
        
        # Add alert widgets for critical insights
        critical_insights = [i for i in insights if i.severity == 'critical']
        if critical_insights:
            widgets.append(self._create_alerts_widget(critical_insights))
        
        # Add insights summary table
        if insights:
            widgets.append(self._create_insights_table_widget(insights))
        
        return sorted(widgets, key=lambda w: w.priority, reverse=True)
    
    def _create_summary_metrics_widget(
        self, 
        insights: List[AccountingInsight], 
        query_results: List[Dict[str, Any]]
    ) -> DashboardWidget:
        """Create summary metrics widget"""
        
        total_financial_impact = sum(
            float(i.financial_impact or 0) for i in insights
        )
        
        critical_issues = len([i for i in insights if i.severity == 'critical'])
        high_issues = len([i for i in insights if i.severity == 'high'])
        
        return DashboardWidget(
            widget_id='summary_metrics',
            title='Analysis Summary',
            type='metric',
            data={
                'metrics': [
                    {'label': 'Total Financial Impact', 'value': f'${total_financial_impact:,.2f}', 'trend': 'neutral'},
                    {'label': 'Critical Issues', 'value': critical_issues, 'trend': 'down' if critical_issues == 0 else 'up'},
                    {'label': 'High Priority Issues', 'value': high_issues, 'trend': 'down' if high_issues == 0 else 'up'},
                    {'label': 'Collections Analyzed', 'value': len(query_results), 'trend': 'neutral'}
                ]
            },
            config={'layout': 'grid', 'columns': 4},
            priority=10
        )
    
    def _create_reconciliation_widgets(self, query_results: List[Dict[str, Any]]) -> List[DashboardWidget]:
        """Create reconciliation-specific widgets"""
        widgets = []
        
        # Find reconciliation data
        recon_data = None
        for result in query_results:
            if 'reconciliation' in result['collection'] and result['success']:
                recon_data = result['data']
                break
        
        if recon_data:
            # Reconciliation status pie chart
            status_counts = {}
            differences_by_status = {}
            
            for item in recon_data:
                status = item.get('status', 'unknown')
                difference = abs(item.get('difference', 0))
                
                status_counts[status] = status_counts.get(status, 0) + 1
                differences_by_status[status] = differences_by_status.get(status, 0) + difference
            
            widgets.append(DashboardWidget(
                widget_id='reconciliation_status',
                title='Reconciliation Status Distribution',
                type='chart',
                data={
                    'chart_type': 'pie',
                    'data': [{'name': k, 'value': v} for k, v in status_counts.items()],
                    'colors': ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
                },
                config={'show_percentages': True},
                priority=8
            ))
            
            # Top differences table
            top_differences = sorted(recon_data, key=lambda x: abs(x.get('difference', 0)), reverse=True)[:10]
            
            widgets.append(DashboardWidget(
                widget_id='top_differences',
                title='Top 10 Reconciliation Differences',
                type='table',
                data={
                    'columns': ['Account Code', 'Account Name', 'Legacy Balance', 'New Balance', 'Difference', 'Status'],
                    'rows': [
                        [
                            item.get('account_code', ''),
                            item.get('account_name', ''),
                            f"${item.get('legacy_balance', 0):,.2f}",
                            f"${item.get('new_balance', 0):,.2f}",
                            f"${item.get('difference', 0):,.2f}",
                            item.get('status', '')
                        ]
                        for item in top_differences
                    ]
                },
                config={'sortable': True, 'filterable': True},
                priority=7
            ))
        
        return widgets
    
    def _create_comparison_widgets(self, query_results: List[Dict[str, Any]]) -> List[DashboardWidget]:
        """Create system comparison widgets"""
        widgets = []
        
        # Find legacy and new account data
        legacy_data = None
        new_data = None
        
        for result in query_results:
            if result['collection'] == 'legacy_accounts' and result['success']:
                legacy_data = result['data']
            elif result['collection'] == 'new_accounts' and result['success']:
                new_data = result['data']
        
        if legacy_data and new_data:
            # Account type comparison
            legacy_by_type = {}
            new_by_type = {}
            
            for account in legacy_data:
                acc_type = account.get('account_type', 'unknown')
                balance = account.get('balance', 0)
                legacy_by_type[acc_type] = legacy_by_type.get(acc_type, 0) + balance
            
            for account in new_data:
                acc_type = account.get('account_type', 'unknown')
                balance = account.get('balance', 0)
                new_by_type[acc_type] = new_by_type.get(acc_type, 0) + balance
            
            # Combine data for comparison chart
            comparison_data = []
            all_types = set(legacy_by_type.keys()) | set(new_by_type.keys())
            
            for acc_type in all_types:
                comparison_data.append({
                    'account_type': acc_type,
                    'legacy_balance': legacy_by_type.get(acc_type, 0),
                    'new_balance': new_by_type.get(acc_type, 0),
                    'difference': new_by_type.get(acc_type, 0) - legacy_by_type.get(acc_type, 0)
                })
            
            widgets.append(DashboardWidget(
                widget_id='balance_comparison',
                title='Balance Comparison by Account Type',
                type='chart',
                data={
                    'chart_type': 'bar',
                    'data': comparison_data,
                    'x_axis': 'account_type',
                    'y_axes': ['legacy_balance', 'new_balance'],
                    'colors': ['#3B82F6', '#10B981']
                },
                config={
                    'legend': {'Legacy System': '#3B82F6', 'New System': '#10B981'},
                    'format_y': 'currency'
                },
                priority=9
            ))
        
        return widgets
    
    def _create_alerts_widget(self, critical_insights: List[AccountingInsight]) -> DashboardWidget:
        """Create alerts widget for critical issues"""
        
        return DashboardWidget(
            widget_id='critical_alerts',
            title='Critical Issues Requiring Attention',
            type='alert',
            data={
                'alerts': [
                    {
                        'title': insight.title,
                        'description': insight.description,
                        'severity': insight.severity,
                        'financial_impact': float(insight.financial_impact) if insight.financial_impact else None,
                        'recommendations': insight.recommendations[:2]  # Top 2 recommendations
                    }
                    for insight in critical_insights[:5]  # Top 5 critical issues
                ]
            },
            config={'auto_refresh': True, 'expand_by_default': True},
            priority=10
        )
    
    def _create_insights_table_widget(self, insights: List[AccountingInsight]) -> DashboardWidget:
        """Create insights summary table"""
        
        return DashboardWidget(
            widget_id='insights_summary',
            title='All Insights & Recommendations',
            type='table',
            data={
                'columns': ['Severity', 'Issue', 'Description', 'Financial Impact', 'Top Recommendation'],
                'rows': [
                    [
                        insight.severity.upper(),
                        insight.title,
                        insight.description[:100] + '...' if len(insight.description) > 100 else insight.description,
                        f'${float(insight.financial_impact):,.2f}' if insight.financial_impact else 'N/A',
                        insight.recommendations[0] if insight.recommendations else 'No recommendations'
                    ]
                    for insight in sorted(insights, key=lambda x: {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}[x.severity], reverse=True)
                ]
            },
            config={'sortable': True, 'paginated': True, 'page_size': 10},
            priority=5
        )

# ===========================
# 7. Complete Pipeline Orchestrator
# ===========================

class AccountingAnalysisPipeline:
    def __init__(self, mongo_uri: str, openai_api_key: str):
        # Initialize all components
        self.mongo_client = MongoClient(mongo_uri)
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        
        self.intent_analyzer = AccountingIntentAnalyzer(self.openai_client)
        self.query_generator = AccountingQueryGenerator(self.mongo_client)
        self.query_executor = AccountingQueryExecutor(self.mongo_client)
        self.insight_generator = AccountingInsightGenerator(self.openai_client)
        self.response_generator = AccountingResponseGenerator(self.openai_client)
        self.dashboard_generator = AccountingDashboardGenerator()
    
    async def process_user_query(self, user_query: str) -> Dict[str, Any]:
        """
        Complete pipeline: User Query → Intent Analysis → Entity Extraction → 
        Query Generation → Execution → Insight Generation → Natural Language Response + Dashboard
        """
        
        try:
            # Step 1: Intent Analysis & Entity Extraction
            print("🔍 Analyzing user intent and extracting entities...")
            parsed_intent = await self.intent_analyzer.analyze_query(user_query)
            
            # Step 2: Query Generation
            print("📝 Generating MongoDB queries...")
            queries = await self.query_generator.generate_queries(parsed_intent)
            
            # Step 3: Query Execution
            print("⚡ Executing queries against MongoDB...")
            query_results = await self.query_executor.execute_queries(queries)
            
            # Step 4: Insight Generation
            print("💡 Generating insights from data...")
            insights = await self.insight_generator.generate_insights(query_results, parsed_intent)
            
            # Step 5: Natural Language Response
            print("📝 Generating natural language response...")
            nl_response = await self.response_generator.generate_response(
                user_query, parsed_intent, insights, query_results
            )
            
            # Step 6: Dynamic Dashboard Generation
            print("📊 Creating dynamic dashboard...")
            dashboard_widgets = await self.dashboard_generator.generate_dashboard(
                parsed_intent, insights, query_results
            )
            
            return {
                'success': True,
                'user_query': user_query,
                'parsed_intent': asdict(parsed_intent),
                'queries_executed': len(queries),
                'insights_generated': len(insights),
                'natural_language_response': nl_response,
                'dashboard_widgets': [asdict(widget) for widget in dashboard_widgets],
                'raw_data': query_results,
                'processing_time': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'user_query': user_query,
                'processing_time': datetime.now().isoformat()
            }

# ===========================
# 8. FastAPI Web Interface
# ===========================

app = FastAPI(title="Accounting System Conversion Analyzer", version="1.0.0")

# Global pipeline instance
pipeline = None

@app.on_event("startup")
async def startup_event():
    global pipeline
    # Initialize with your MongoDB URI and OpenAI API key
    pipeline = AccountingAnalysisPipeline(
        mongo_uri="mongodb://localhost:27017",
        openai_api_key="your-openai-api-key"
    )

class QueryRequest(BaseModel):
    query: str

@app.post("/analyze")
async def analyze_accounting_data(request: QueryRequest):
    """Main endpoint for accounting data analysis"""
    if not pipeline:
        raise HTTPException(status_code=500, detail="Pipeline not initialized")
    
    result = await pipeline.process_user_query(request.query)
    return result

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time analysis"""
    await websocket.accept()
    
    try:
        while True:
            # Receive user query
            data = await websocket.receive_text()
            query_data = json.loads(data)
            
            # Process query
            result = await pipeline.process_user_query(query_data['query'])
            
            # Send result back
            await websocket.send_text(json.dumps(result, default=str))
            
    except Exception as e:
        await websocket.send_text(json.dumps({'error': str(e)}))

# ===========================
# 9. Example Usage & Testing
# ===========================

async def example_usage():
    """Example of how to use the accounting analysis pipeline"""
    
    # Initialize pipeline
    pipeline = AccountingAnalysisPipeline(
        mongo_uri="mongodb://localhost:27017",
        openai_api_key="your-openai-api-key"
    )
    
    # Example queries that demonstrate the system
    example_queries = [
        "Show me reconciliation differences greater than $1000",
        "Compare account balances between legacy and new system for Q3 2024",
        "What accounts have the biggest discrepancies after migration?",
        "Generate a reconciliation report for revenue accounts",
        "Are there any data quality issues in the converted transactions?",
        "Show me the migration status for all account types",
        "Which GL accounts in the 4000 series have balance differences?",
        "Create an audit trail for transaction 12345",
    ]
    
    for query in example_queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print('='*60)
        
        result = await pipeline.process_user_query(query)
        
        if result['success']:
            print(f"Intent: {result['parsed_intent']['intent']}")
            print(f"Insights: {result['insights_generated']}")
            print(f"Dashboard Widgets: {len(result['dashboard_widgets'])}")
            print(f"\nResponse: {result['natural_language_response'][:200]}...")
        else:
            print(f"Error: {result['error']}")

if __name__ == "__main__":
    import uvicorn
    
    # Run the FastAPI application
    uvicorn.run(app, host="0.0.0.0", port=8000)
