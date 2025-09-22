# React Fund Information Extraction UI Development Prompt

## Project Overview

Develop a React application with Material Design theme that uses an LLM agent to extract fund information from prospectuses for accounting system static data setup.

## Tech Stack Requirements

- **Frontend**: React 18+ with TypeScript
- **UI Framework**: Material-UI (MUI) v5+
- **State Management**: React Context API or Redux Toolkit
- **File Handling**: React Dropzone for file uploads
- **HTTP Client**: Axios for API calls
- **LLM Integration**: OpenAI API or similar LLM service
- **PDF Processing**: PDF.js or react-pdf for document parsing
- **Form Management**: React Hook Form with Yup validation
- **Styling**: Material-UI theming with custom theme provider

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Layout.tsx
│   │   ├── Stepper.tsx
│   │   └── LoadingOverlay.tsx
│   ├── fund-extraction/
│   │   ├── FundTypeSelector.tsx
│   │   ├── ModelFundSelector.tsx
│   │   ├── ProspectusUpload.tsx
│   │   ├── ExtractionProgress.tsx
│   │   ├── DataReview.tsx
│   │   └── ExportOptions.tsx
│   └── forms/
│       ├── FundDetailsForm.tsx
│       └── AccountingMappingForm.tsx
├── services/
│   ├── llmService.ts
│   ├── pdfService.ts
│   └── fundDataService.ts
├── types/
│   ├── fund.types.ts
│   └── extraction.types.ts
├── hooks/
│   ├── useFundExtraction.ts
│   └── useFileProcessing.ts
├── context/
│   └── ExtractionContext.tsx
├── theme/
│   └── theme.ts
└── utils/
    ├── validators.ts
    └── formatters.ts
```

## Core Features & Components

### 1. Material Design Theme Configuration

Create a custom MUI theme with:

- Primary color scheme for financial applications (blues/grays)
- Typography optimized for data-heavy interfaces
- Component overrides for consistent styling
- Dark/light mode support
- Responsive breakpoints

### 2. Multi-Step Wizard Interface

Implement a stepper component with these steps:

#### Step 1: Fund Type Definition

- **Component**: `FundTypeSelector.tsx`
- **Features**:
  - Radio button group for fund types (Mutual Fund, ETF, Hedge Fund, Private Equity, etc.)
  - Dynamic form fields based on selected fund type
  - Validation for required fund classification
  - Information tooltips for each fund type

#### Step 2: Model Fund Selection

- **Component**: `ModelFundSelector.tsx`
- **Features**:
  - Searchable dropdown of existing fund models
  - Option to create new model fund
  - Display of model fund characteristics
  - Mapping preview showing data fields to extract

#### Step 3: Prospectus Upload & Processing

- **Component**: `ProspectusUpload.tsx`
- **Features**:
  - Drag-and-drop file upload zone
  - Support for PDF, DOC, DOCX formats
  - File validation (size, type, structure)
  - Progress indicator for upload and processing
  - PDF preview with page navigation

#### Step 4: LLM Extraction Process

- **Component**: `ExtractionProgress.tsx`
- **Features**:
  - Real-time progress tracking
  - Step-by-step extraction status
  - Error handling and retry mechanisms
  - Extraction confidence scores
  - Cancel/pause extraction options

#### Step 5: Data Review & Validation

- **Component**: `DataReview.tsx`
- **Features**:
  - Tabbed interface for different data categories
  - Editable data grid with inline validation
  - Confidence score indicators
  - Side-by-side comparison with source document
  - Manual override capabilities
  - Data quality scoring

#### Step 6: Export & Integration

- **Component**: `ExportOptions.tsx`
- **Features**:
  - Multiple export formats (JSON, CSV, XML)
  - Direct integration with accounting systems
  - Data mapping preview
  - Batch processing options

### 3. Data Extraction Categories

Define TypeScript interfaces for extracted data:

#### Fund Basic Information

```typescript
interface FundBasicInfo {
  fundName: string;
  fundSymbol: string;
  fundType: FundType;
  inceptionDate: Date;
  domicile: string;
  baseCurrency: string;
  shareClasses: ShareClass[];
  investmentObjective: string;
  benchmark: string;
}
```

#### Accounting Static Data

```typescript
interface AccountingStaticData {
  custodian: string;
  administrator: string;
  auditor: string;
  transferAgent: string;
  valuationFrequency: string;
  priceSource: string;
  nav: number;
  totalAssets: number;
  expenseRatio: number;
  managementFee: number;
  performanceFee?: number;
}
```

#### Regulatory Information

```typescript
interface RegulatoryInfo {
  secRegistration: string;
  prospectusDate: Date;
  fiscalYearEnd: Date;
  distributionFrequency: string;
  minimumInvestment: number;
  taxStatus: string;
}
```

### 4. LLM Integration Service

#### Extraction Prompts

Create specialized prompts for different data categories:

```typescript
const EXTRACTION_PROMPTS = {
  basicInfo: `Extract basic fund information from the prospectus including fund name, type, inception date, and investment objective. Return structured JSON.`,
  
  accountingData: `Extract accounting-related data including custodian, administrator, fees, NAV, and expense ratios. Focus on numerical values with proper formatting.`,
  
  shareClasses: `Identify all share classes with their specific characteristics, fees, and minimum investment requirements.`,
  
  regulatory: `Extract regulatory information including SEC registration, tax status, and compliance requirements.`
};
```

#### Error Handling & Validation

- Implement retry logic for failed extractions
- Confidence scoring for extracted data
- Manual review queue for low-confidence extractions
- Data consistency validation across categories

### 5. UI/UX Requirements

#### Material Design Components to Use:

- `Stepper` for wizard navigation
- `Card` and `Paper` for content sections
- `DataGrid` for tabular data review
- `Autocomplete` for fund model selection
- `Chip` for tags and categories
- `Dialog` for confirmations and detailed views
- `Skeleton` for loading states
- `Alert` and `Snackbar` for notifications

#### Responsive Design:

- Mobile-first approach
- Collapsible sidebar navigation
- Adaptive grid layouts
- Touch-friendly controls
- Proper spacing and typography scaling

#### Accessibility:

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management in dialogs

### 6. State Management Pattern

Use React Context for global state:

```typescript
interface ExtractionState {
  currentStep: number;
  fundType: FundType | null;
  modelFund: ModelFund | null;
  uploadedFile: File | null;
  extractedData: ExtractedData | null;
  isProcessing: boolean;
  errors: ExtractionError[];
}
```

### 7. API Integration Points

Define service interfaces for:

#### LLM Service

```typescript
interface LLMService {
  extractBasicInfo(content: string): Promise<FundBasicInfo>;
  extractAccountingData(content: string): Promise<AccountingStaticData>;
  extractRegulatoryInfo(content: string): Promise<RegulatoryInfo>;
  validateExtraction(data: any): Promise<ValidationResult>;
}
```

#### Fund Data Service

```typescript
interface FundDataService {
  getModelFunds(): Promise<ModelFund[]>;
  saveFundData(data: ExtractedData): Promise<SaveResult>;
  exportToFormat(data: ExtractedData, format: ExportFormat): Promise<Blob>;
  validateAccountingData(data: AccountingStaticData): Promise<ValidationResult>;
}
```

### 8. Development Setup Instructions

1. **Initialize Project**:
   
   ```bash
   npx create-react-app fund-extraction --template typescript
   cd fund-extraction
   npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
   npm install react-hook-form yup @hookform/resolvers
   npm install axios react-dropzone react-pdf pdf2pic
   ```
1. **Configure Theme**:
- Set up MUI theme provider
- Define custom color palette
- Configure typography scale
- Set up responsive breakpoints
1. **Component Development Order**:
- Start with layout and navigation
- Build individual step components
- Implement state management
- Add LLM integration
- Implement data validation
- Add export functionality
1. **Testing Strategy**:
- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for LLM workflows
- E2E tests for complete user journeys

### 9. Performance Considerations

- Lazy load PDF processing libraries
- Implement virtual scrolling for large datasets
- Use React.memo for expensive components
- Optimize LLM API calls with batching
- Implement progressive file upload
- Cache model fund data

### 10. Security & Validation

- Sanitize file uploads
- Validate extracted data against schemas
- Implement rate limiting for LLM calls
- Secure API endpoints
- Handle sensitive financial data appropriately
- Implement audit logging

This prompt provides a comprehensive foundation for building a professional-grade fund information extraction application with React and Material Design.
