# Decision Log

## 2025-03-30: Archiving Records and Cost Field Implementation

### Context
The user requested two new features for the FlatCrawl application:
1. Add an archiving capability for records
2. Add a new "cost" field to store pricing information

### Decision
We will implement both features by:
1. Adding a new "cost" field in the CSV structure right after the "source" field
2. Adding a new "archived" field at the end of the CSV structure
3. Updating the UI to display and allow editing of these new fields
4. Adding an "Archive" button in the UI actions column

### Alternatives Considered
1. **Separate Archive Table**: We considered moving archived records to a separate table/file, but this would complicate the data structure and require more significant changes to the application.
2. **Delete Instead of Archive**: We considered adding a delete functionality instead of archiving, but archiving provides better data retention and allows for recovery if needed.
3. **Cost as a Numeric Field**: We considered implementing the cost field as a numeric field with validation, but a simple text field provides more flexibility for different formats and currencies.

### Consequences
- **Positive**: 
  - Users can now track costs associated with each record
  - Users can archive records they no longer need to actively track without losing the data
  - The implementation is minimally invasive to the existing codebase
- **Negative**: 
  - Existing CSV files will need to be updated to the new structure
  - The UI will become slightly more complex with additional columns

### Implementation Plan
A detailed implementation plan has been created in [archiving-and-cost-implementation-plan.md](./archiving-and-cost-implementation-plan.md) with visual diagrams in [archiving-and-cost-diagrams.md](./archiving-and-cost-diagrams.md).