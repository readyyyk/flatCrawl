# Archiving and Cost Implementation Diagrams

## CSV Structure Changes

```mermaid
graph LR
    subgraph "Current CSV Structure"
    A[id] --> B[source] --> C[url] --> D[dateAdded] --> E[seen] --> F[ok] --> G[called] --> H[active]
    end
    
    subgraph "New CSV Structure"
    I[id] --> J[source] --> K[cost] --> L[url] --> M[dateAdded] --> N[seen] --> O[ok] --> P[called] --> Q[active] --> R[archived]
    end
    
    style K fill:#f9f,stroke:#333,stroke-width:2px
    style R fill:#f9f,stroke:#333,stroke-width:2px
```

## UI Component Changes

```mermaid
graph TD
    subgraph "Current UI Table"
    A[ID] --> B[Source] --> C[URL] --> D[Date Added] --> E[Seen] --> F[OK] --> G[Called] --> H[Active] --> I[Actions]
    end
    
    subgraph "New UI Table"
    J[ID] --> K[Source] --> L[Cost] --> M[URL] --> N[Date Added] --> O[Seen] --> P[OK] --> Q[Called] --> R[Active] --> S[Archived] --> T[Actions<br>+ Archive Button]
    end
    
    style L fill:#f9f,stroke:#333,stroke-width:2px
    style S fill:#f9f,stroke:#333,stroke-width:2px
    style T fill:#f9f,stroke:#333,stroke-width:2px
```

## Data Flow for Archive Action with Confirmation

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant ConfirmDialog
    participant Server
    participant CSV
    
    User->>UI: Click "Archive" button
    UI->>ConfirmDialog: Show confirmation dialog
    ConfirmDialog-->>User: Display "Are you sure?" message
    User->>ConfirmDialog: Confirm archive action
    ConfirmDialog->>UI: User confirmed
    UI->>UI: Set archived=true for record
    UI->>UI: Apply visual styling to row
    UI->>Server: POST /api/data with updated records
    Server->>CSV: Write updated records
    CSV-->>Server: Write confirmation
    Server-->>UI: Success response
    UI-->>User: Show success message
```

## Cost Field Implementation

```mermaid
graph TD
    A[Add cost field to UrlRecord interface] --> B[Update CSV header in CsvStorage]
    B --> C[Update columns array in write method]
    C --> D[Add cost column to HTML table]
    D --> E[Create input field with centered text and monospace font]
    E --> F[Handle cost field changes in JavaScript]
    
    style A fill:#b5e7a0,stroke:#333,stroke-width:1px
    style B fill:#b5e7a0,stroke:#333,stroke-width:1px
    style C fill:#b5e7a0,stroke:#333,stroke-width:1px
    style D fill:#ffcc5c,stroke:#333,stroke-width:1px
    style E fill:#ffcc5c,stroke:#333,stroke-width:1px
    style F fill:#ffcc5c,stroke:#333,stroke-width:1px
```

## Archive Feature Implementation

```mermaid
graph TD
    A[Add archived field to UrlRecord interface] --> B[Update CSV header in CsvStorage]
    B --> C[Update columns array in write method]
    C --> D[Add archived column to HTML table]
    D --> E[Create checkbox for archived status]
    E --> F[Add Archive button to actions column]
    F --> G[Implement Archive button functionality]
    G --> H[Add confirmation dialog]
    H --> I[Add visual styling for archived rows]
    
    style A fill:#b5e7a0,stroke:#333,stroke-width:1px
    style B fill:#b5e7a0,stroke:#333,stroke-width:1px
    style C fill:#b5e7a0,stroke:#333,stroke-width:1px
    style D fill:#ffcc5c,stroke:#333,stroke-width:1px
    style E fill:#ffcc5c,stroke:#333,stroke-width:1px
    style F fill:#ffcc5c,stroke:#333,stroke-width:1px
    style G fill:#ffcc5c,stroke:#333,stroke-width:1px
    style H fill:#ffcc5c,stroke:#333,stroke-width:1px
    style I fill:#ffcc5c,stroke:#333,stroke-width:1px
```

## File Changes Overview

```mermaid
graph TD
    A[src/types/index.ts] --> B[Update UrlRecord interface]
    C[src/storage/csv.ts] --> D[Update CSV headers and columns]
    E[src/ui/public/index.html] --> F[Add new table columns]
    G[src/ui/public/js/app.js] --> H[Update rendering and add functionality]
    H --> I[Add confirmation dialog]
    H --> J[Add visual styling for archived rows]
    K[src/ui/public/css/styles.css] --> L[Add styles for cost field]
    K --> M[Add styles for archive button]
    K --> N[Add styles for archived rows]
    
    style A fill:#b5e7a0,stroke:#333,stroke-width:1px
    style C fill:#b5e7a0,stroke:#333,stroke-width:1px
    style E fill:#ffcc5c,stroke:#333,stroke-width:1px
    style G fill:#ffcc5c,stroke:#333,stroke-width:1px
    style I fill:#ffcc5c,stroke:#333,stroke-width:1px
    style J fill:#ffcc5c,stroke:#333,stroke-width:1px
    style K fill:#ffcc5c,stroke:#333,stroke-width:1px
    style N fill:#ffcc5c,stroke:#333,stroke-width:1px
```

## Visual Styling for Archived Rows

```mermaid
graph TD
    subgraph "Normal Row"
    A[Regular styling]
    end
    
    subgraph "Archived Row"
    B[Strikethrough text or grayed out appearance]
    end
    
    C[CSS Rule] --> D[.archived-row { opacity: 0.6; text-decoration: line-through; }]
    
    style B fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#b5e7a0,stroke:#333,stroke-width:1px
```

## Confirmation Dialog Implementation

```mermaid
sequenceDiagram
    participant User
    participant ArchiveButton
    participant ConfirmDialog
    participant DataHandler
    
    User->>ArchiveButton: Click
    ArchiveButton->>ConfirmDialog: Show dialog
    ConfirmDialog-->>User: "Are you sure you want to archive this record?"
    Note over ConfirmDialog: Options: "Cancel" and "Archive"
    
    alt User clicks "Cancel"
        User->>ConfirmDialog: Click "Cancel"
        ConfirmDialog->>ArchiveButton: Cancel operation
    else User clicks "Archive"
        User->>ConfirmDialog: Click "Archive"
        ConfirmDialog->>DataHandler: Proceed with archive
        DataHandler->>DataHandler: Set archived=true
        DataHandler->>DataHandler: Apply visual styling
        DataHandler-->>User: Show success message
    end