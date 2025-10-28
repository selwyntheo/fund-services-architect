I'll provide you with comprehensive, detailed requirements for building a workflow versioning and approval system. This is structured for optimal use with Copilot.

---

# Workflow Versioning & Approval System - Detailed Requirements

## System Overview
Build a versioning and approval system for ReactFlow-based workflow builder that allows users to create, edit, submit, and approve workflow changes with visual diff highlighting.

---

## 1. DATA MODELS & STRUCTURES

### 1.1 Workflow Version Model
```typescript
interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  flowData: {
    nodes: Node[];
    edges: Edge[];
  };
  changeLog: ChangeLogEntry[];
  parentVersionId?: string; // Reference to the version this was branched from
}

interface ChangeLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  changeType: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'edge_modified';
  description: string;
  entityId: string; // Node or Edge ID
  previousValue?: any;
  newValue?: any;
}
```

### 1.2 Approval Request Model
```typescript
interface ApprovalRequest {
  id: string;
  workflowVersionId: string;
  requestedBy: string;
  requestedAt: Date;
  approvers: string[]; // List of user IDs who can approve
  status: 'pending' | 'approved' | 'rejected';
  comments: ApprovalComment[];
  deadline?: Date;
}

interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  comment: string;
  mentions?: string[];
}
```

### 1.3 Workflow Diff Model
```typescript
interface WorkflowDiff {
  addedNodes: Node[];
  removedNodes: Node[];
  modifiedNodes: ModifiedNode[];
  addedEdges: Edge[];
  removedEdges: Edge[];
  modifiedEdges: ModifiedEdge[];
}

interface ModifiedNode {
  id: string;
  before: Node;
  after: Node;
  changedFields: string[];
}

interface ModifiedEdge {
  id: string;
  before: Edge;
  after: Edge;
  changedFields: string[];
}
```

---

## 2. CORE FUNCTIONALITY REQUIREMENTS

### 2.1 Version Management

**Create New Version**
- User clicks "Save as New Version" button
- System creates new version with incremented version number
- Status set to 'draft'
- Parent version ID references current published version
- Generate automatic change log by comparing with parent version

**Version History View**
- Display list of all versions with: version number, status, created by, created date
- Filterable by status (draft, pending, approved, rejected, published)
- Sortable by date or version number
- Click to view/edit version details

**Version Comparison**
- Select two versions to compare (typically current vs pending)
- Calculate diff using deep comparison algorithm
- Display side-by-side or overlay comparison view

### 2.2 Approval Workflow

**Submit for Approval**
- User clicks "Submit for Approval" on draft version
- Modal appears to:
  - Add description of changes
  - Select approvers from list
  - Set optional deadline
  - Add initial comments
- Status changes to 'pending_approval'
- Notification sent to selected approvers

**Approval Interface**
- Approvers receive notification
- View pending approval requests in dedicated dashboard
- Open approval view showing:
  - Workflow with highlighted changes
  - Change summary panel
  - Comment section
  - Approve/Reject buttons

**Approve Action**
- Approver clicks "Approve"
- Optional: Add approval comments
- Status changes to 'approved'
- Auto-publish option: If enabled, approved version becomes published
- Notification sent to requester

**Reject Action**
- Approver clicks "Reject"
- Required: Add rejection reason
- Status changes to 'rejected'
- Version remains editable by creator
- Notification sent to requester

---

## 3. VISUAL DIFF & HIGHLIGHTING SYSTEM

### 3.1 ReactFlow Integration

**Node Highlighting**
```typescript
// Add custom styling to nodes based on diff status
interface NodeHighlight {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  changedFields?: string[];
}

// Apply to node data
node.data.highlight = {
  type: 'modified',
  changedFields: ['label', 'config.timeout']
};
```

**Visual Styling Requirements**
- **Added nodes**: Green border (3px solid #10b981), light green background (#ecfdf5)
- **Removed nodes**: Red border (3px solid #ef4444), light red background (#fef2f2), 50% opacity
- **Modified nodes**: Orange border (3px solid #f59e0b), light orange background (#fffbeb)
- **Modified fields**: Within node, highlight specific fields with orange badge
- **Unchanged nodes**: Standard styling with subtle gray border

**Edge Highlighting**
- **Added edges**: Green stroke (strokeWidth: 3, stroke: '#10b981'), animated
- **Removed edges**: Red dashed stroke (strokeWidth: 3, stroke: '#ef4444', strokeDasharray: '5,5'), 50% opacity
- **Modified edges**: Orange stroke (strokeWidth: 3, stroke: '#f59e0b')
- **Unchanged edges**: Standard gray stroke

### 3.2 Change Indicator Components

**Legend Component**
```typescript
// Display legend showing what each color means
<DiffLegend>
  - Added (Green)
  - Removed (Red)
  - Modified (Orange)
  - Unchanged (Gray)
</DiffLegend>
```

**Change Summary Panel**
```typescript
<ChangeSummaryPanel>
  - Total Changes: X
  - Nodes Added: X (show list)
  - Nodes Removed: X (show list)
  - Nodes Modified: X (show list with changed fields)
  - Edges Added: X
  - Edges Removed: X
  - Edges Modified: X
</ChangeSummaryPanel>
```

**Hover Details**
- On hover over modified node: Show tooltip with before/after values for changed fields
- On hover over added/removed elements: Show what was added/removed

### 3.3 Comparison View Modes

**Overlay Mode** (Default)
- Show single workflow with all changes highlighted
- Toggle to show/hide removed elements
- Toggle to show/hide unchanged elements

**Side-by-Side Mode**
- Left panel: Previous version
- Right panel: New version
- Synchronized scrolling and zoom
- Connecting lines between corresponding nodes

**Animation Mode**
- Animate transition from old to new version
- Fade in added elements
- Fade out removed elements
- Morph modified elements

---

## 4. UI COMPONENTS SPECIFICATION

### 4.1 Version Control Toolbar
```typescript
<VersionControlToolbar>
  - Current Version Badge: "v1.2 (Draft)" with status color
  - "Save Version" button
  - "Submit for Approval" button (enabled for drafts only)
  - "Version History" button → opens modal
  - "Compare Versions" dropdown
  - Version selector dropdown (quick switch)
</VersionControlToolbar>
```

### 4.2 Version History Modal
```typescript
<VersionHistoryModal>
  <Filter>
    - Status filter: All | Draft | Pending | Approved | Rejected | Published
    - Date range picker
    - Created by filter
  </Filter>
  <VersionList>
    <VersionCard key={version.id}>
      - Version number & title
      - Status badge
      - Created by & date
      - Action buttons: View | Edit | Compare | Delete
      - Expand for change log
    </VersionCard>
  </VersionList>
</VersionHistoryModal>
```

### 4.3 Approval Dashboard
```typescript
<ApprovalDashboard>
  <Tabs>
    - "Pending My Approval" (with count badge)
    - "My Requests" (submissions I made)
    - "All Approvals" (if user is admin)
  </Tabs>
  <ApprovalList>
    <ApprovalCard>
      - Workflow name & version
      - Requester info
      - Requested date & deadline
      - Change summary (X nodes, Y edges modified)
      - Priority indicator
      - "Review" button
    </ApprovalCard>
  </ApprovalList>
</ApprovalDashboard>
```

### 4.4 Approval Review Interface
```typescript
<ApprovalReviewInterface>
  <Header>
    - Workflow title & version
    - Requester info
    - Status & deadline
  </Header>
  
  <MainArea layout="split">
    <LeftPanel width="70%">
      <DiffLegend />
      <ViewModeToggle options={['overlay', 'side-by-side']} />
      <ShowHideToggles>
        - Show/hide removed elements
        - Show/hide unchanged elements
        - Highlight modified fields only
      </ShowHideToggles>
      <ReactFlowCanvas diffHighlighted={true} />
    </LeftPanel>
    
    <RightPanel width="30%">
      <ChangeSummaryPanel />
      <ChangeLogTimeline />
      <CommentsSection>
        - Thread of comments
        - Add new comment input
        - @mention support
      </CommentsSection>
      <ActionButtons>
        - "Approve" button (green, primary)
        - "Reject" button (red, secondary)
        - "Request Changes" button (optional)
      </ActionButtons>
    </RightPanel>
  </MainArea>
</ApprovalReviewInterface>
```

### 4.5 Submit for Approval Modal
```typescript
<SubmitApprovalModal>
  <FormField label="Version Title" required>
    <TextInput placeholder="e.g., Added error handling to payment flow" />
  </FormField>
  
  <FormField label="Description" required>
    <TextArea 
      placeholder="Describe what changed and why..."
      minLength={20}
    />
  </FormField>
  
  <FormField label="Select Approvers" required>
    <UserMultiSelect 
      users={eligibleApprovers}
      minRequired={1}
    />
  </FormField>
  
  <FormField label="Deadline (Optional)">
    <DateTimePicker />
  </FormField>
  
  <FormField label="Priority">
    <Select options={['Low', 'Medium', 'High', 'Urgent']} />
  </FormField>
  
  <ChangeSummaryPreview />
  
  <Actions>
    <Button variant="secondary" onClick={cancel}>Cancel</Button>
    <Button variant="primary" onClick={submit}>Submit for Approval</Button>
  </Actions>
</SubmitApprovalModal>
```

---

## 5. ALGORITHMS & LOGIC

### 5.1 Diff Calculation Algorithm
```typescript
function calculateWorkflowDiff(
  previousVersion: WorkflowVersion,
  currentVersion: WorkflowVersion
): WorkflowDiff {
  const prevNodes = new Map(previousVersion.flowData.nodes.map(n => [n.id, n]));
  const currNodes = new Map(currentVersion.flowData.nodes.map(n => [n.id, n]));
  
  // Find added, removed, and modified nodes
  const addedNodes = currentVersion.flowData.nodes.filter(n => !prevNodes.has(n.id));
  const removedNodes = previousVersion.flowData.nodes.filter(n => !currNodes.has(n.id));
  const modifiedNodes = currentVersion.flowData.nodes
    .filter(n => prevNodes.has(n.id))
    .map(currNode => {
      const prevNode = prevNodes.get(currNode.id)!;
      const changedFields = findChangedFields(prevNode, currNode);
      return changedFields.length > 0 
        ? { id: currNode.id, before: prevNode, after: currNode, changedFields }
        : null;
    })
    .filter(Boolean);
  
  // Similar logic for edges...
  
  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges,
    removedEdges,
    modifiedEdges
  };
}

function findChangedFields(objA: any, objB: any, path = ''): string[] {
  const changes: string[] = [];
  
  // Deep comparison logic
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
  
  for (const key of allKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof objA[key] === 'object' && typeof objB[key] === 'object') {
      changes.push(...findChangedFields(objA[key], objB[key], fullPath));
    } else if (objA[key] !== objB[key]) {
      changes.push(fullPath);
    }
  }
  
  return changes;
}
```

### 5.2 Change Log Generation
```typescript
function generateChangeLog(diff: WorkflowDiff, userId: string): ChangeLogEntry[] {
  const entries: ChangeLogEntry[] = [];
  const timestamp = new Date();
  
  diff.addedNodes.forEach(node => {
    entries.push({
      id: generateId(),
      timestamp,
      userId,
      changeType: 'node_added',
      description: `Added node: ${node.data.label}`,
      entityId: node.id,
      newValue: node
    });
  });
  
  diff.removedNodes.forEach(node => {
    entries.push({
      id: generateId(),
      timestamp,
      userId,
      changeType: 'node_removed',
      description: `Removed node: ${node.data.label}`,
      entityId: node.id,
      previousValue: node
    });
  });
  
  diff.modifiedNodes.forEach(mod => {
    entries.push({
      id: generateId(),
      timestamp,
      userId,
      changeType: 'node_modified',
      description: `Modified node: ${mod.after.data.label} (${mod.changedFields.join(', ')})`,
      entityId: mod.id,
      previousValue: mod.before,
      newValue: mod.after
    });
  });
  
  // Similar for edges...
  
  return entries;
}
```

---

## 6. STATE MANAGEMENT

### 6.1 Redux/Zustand Store Structure
```typescript
interface VersioningStore {
  // Current state
  currentVersion: WorkflowVersion | null;
  versions: WorkflowVersion[];
  activeComparison: {
    baseVersion: WorkflowVersion;
    compareVersion: WorkflowVersion;
    diff: WorkflowDiff;
  } | null;
  
  // Approval state
  pendingApprovals: ApprovalRequest[];
  mySubmissions: ApprovalRequest[];
  
  // UI state
  isComparingVersions: boolean;
  showRemovedElements: boolean;
  showUnchangedElements: boolean;
  comparisonMode: 'overlay' | 'side-by-side';
  
  // Actions
  loadVersions: () => Promise<void>;
  createVersion: (data: Partial<WorkflowVersion>) => Promise<WorkflowVersion>;
  updateVersion: (id: string, data: Partial<WorkflowVersion>) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
  compareVersions: (baseId: string, compareId: string) => void;
  submitForApproval: (versionId: string, approvers: string[], description: string) => Promise<void>;
  approveVersion: (approvalId: string, comments?: string) => Promise<void>;
  rejectVersion: (approvalId: string, reason: string) => Promise<void>;
}
```

---

## 7. API ENDPOINTS SPECIFICATION

### 7.1 Version Management Endpoints
```typescript
// GET /api/workflows/{workflowId}/versions
// Response: WorkflowVersion[]

// GET /api/workflows/{workflowId}/versions/{versionId}
// Response: WorkflowVersion

// POST /api/workflows/{workflowId}/versions
// Body: { title, description, flowData }
// Response: WorkflowVersion

// PUT /api/workflows/{workflowId}/versions/{versionId}
// Body: Partial<WorkflowVersion>
// Response: WorkflowVersion

// DELETE /api/workflows/{workflowId}/versions/{versionId}
// Response: { success: boolean }

// GET /api/workflows/{workflowId}/versions/compare?base={versionId}&compare={versionId}
// Response: WorkflowDiff
```

### 7.2 Approval Endpoints
```typescript
// POST /api/approvals
// Body: { versionId, approvers, description, deadline }
// Response: ApprovalRequest

// GET /api/approvals/pending
// Response: ApprovalRequest[]

// GET /api/approvals/my-submissions
// Response: ApprovalRequest[]

// POST /api/approvals/{approvalId}/approve
// Body: { comments?: string }
// Response: ApprovalRequest

// POST /api/approvals/{approvalId}/reject
// Body: { reason: string }
// Response: ApprovalRequest

// POST /api/approvals/{approvalId}/comments
// Body: { comment: string, mentions?: string[] }
// Response: ApprovalComment
```

---

## 8. IMPLEMENTATION STEPS FOR COPILOT

### Phase 1: Data Layer
1. Create TypeScript interfaces for all models
2. Set up state management store with versioning actions
3. Implement diff calculation algorithm
4. Create change log generator
5. Add mock data for testing

### Phase 2: Core Version Management
1. Create Version History modal component
2. Implement version list with filtering/sorting
3. Add create/save version functionality
4. Build version comparison selector
5. Implement version switching logic

### Phase 3: Visual Diff System
1. Create node highlighting wrapper components
2. Implement edge highlighting for ReactFlow
3. Build diff legend component
4. Create change summary panel
5. Add tooltip showing before/after values
6. Implement toggle controls (show/hide removed, etc.)

### Phase 4: Approval Workflow
1. Create Submit for Approval modal
2. Build Approval Dashboard with tabs
3. Implement Approval Review Interface
4. Create comment system with threading
5. Add approve/reject actions with validation
6. Implement notification system

### Phase 5: Comparison View Modes
1. Implement overlay mode (default)
2. Build side-by-side comparison view
3. Add synchronized scrolling for side-by-side
4. Create view mode toggle
5. Implement animation transitions (optional)

### Phase 6: Integration & Polish
1. Integrate with existing ReactFlow workflow builder
2. Add keyboard shortcuts (e.g., Ctrl+K for compare)
3. Implement auto-save for drafts
4. Add loading states and error handling
5. Create user permissions checks
6. Add analytics/audit logging
7. Performance optimization for large workflows

---

## 9. TECHNICAL CONSIDERATIONS

### Performance
- Lazy load version history (paginate if >50 versions)
- Debounce diff calculations
- Memoize ReactFlow nodes/edges with highlighted styles
- Use virtual scrolling for large change lists

### Accessibility
- ARIA labels for all status badges and buttons
- Keyboard navigation for version selection
- Screen reader announcements for status changes
- High contrast mode for diff highlights

### Security
- Validate user permissions before showing/allowing approvals
- Sanitize all user inputs (comments, descriptions)
- Audit log all approval actions
- Implement rate limiting on API endpoints

### Testing
- Unit tests for diff calculation algorithm
- Integration tests for approval workflow
- E2E tests for complete version lifecycle
- Visual regression tests for diff highlighting

---

## 10. COPILOT PROMPT TEMPLATE

Use this template when working with Copilot:

```
I'm building a [specific component/feature] for a workflow versioning system. 

Context:
- Using ReactFlow for workflow visualization
- React + TypeScript
- [State management solution]

Requirements:
[Paste relevant section from above]

Implementation details:
- [Specific styling requirements]
- [Specific logic requirements]
- [Integration points]

Please implement [specific functionality] following the requirements above. Include proper TypeScript types, error handling, and comments.
```

---

This specification gives you a comprehensive blueprint to feed into Copilot iteratively. Start with Phase 1 and work through each section, providing context from this document as needed!
