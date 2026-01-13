# Family Tree API Implementation

## Overview
The `viewFamilyTree` API endpoint has been implemented to return a generation-based family tree structure that matches the visual layout shown in your reference image.

## API Endpoint

### GET `/admin/family/tree`

Returns the complete family tree organized by generations.

## Response Structure

```json
{
  "generations": [
    {
      "level": 0,
      "label": "Great-Grandparents",
      "members": [
        {
          "id": 1,
          "fullname": "John Doe",
          "nickname": "Johnny",
          "gender": "male",
          "birth_date": "1920-01-01",
          "death_date": null,
          "photo_url": "https://example.com/photo.jpg",
          "bio": "Biography text...",
          "spouse_id": 2,
          "father_id": null,
          "mother_id": null,
          "children_ids": [3, 4]
        }
      ]
    }
  ],
  "total_members": 15,
  "total_generations": 5
}
```

## Key Features

### 1. **Generation-Based Organization**
- Members are grouped by generation level (0 = oldest ancestors)
- Each generation has a descriptive label (e.g., "Grandparents", "Parents Generation")
- Perfect for rendering horizontal rows in a family tree visualization

### 2. **Relationship Tracking**
Each member includes:
- `spouse_id`: Link to their spouse
- `father_id`: Link to their father
- `mother_id`: Link to their mother
- `children_ids`: Array of all children IDs

### 3. **Smart Generation Detection**
The system uses the closure table to automatically:
- Calculate each member's generation level
- Determine the deepest generation
- Assign appropriate generation labels

### 4. **Sorted Data**
- Generations are sorted from oldest to youngest
- Members within each generation are sorted by birth date
- Easy to render in chronological order

## Implementation Details

### Algorithm Flow

1. **Fetch All Members**: Load all family members with their parent and children relationships
2. **Calculate Max Depth**: Query the closure table to find the maximum genealogical depth
3. **Assign Generations**: For each member, calculate their generation level based on their depth in the tree
4. **Group by Generation**: Organize members into generation buckets
5. **Format Response**: Create the final JSON structure with labels and metadata

### Generation Level Calculation

```
Generation Level = Max Depth - Member Depth
```

Example:
- If max depth is 4 (5 generations total: 0-4)
- A member with depth 4 (great-great-grandparent) → Generation Level 0
- A member with depth 2 (grandchild) → Generation Level 2
- A member with depth 0 (youngest) → Generation Level 4

### Generation Labels

The system automatically generates human-readable labels:
- Level 0: "Great-Great-Grandparents", "Great-Grandparents", "Grandparents", or "Parents"
- Middle levels: "Parents Generation", "Current Generation"
- Last level: "Children"
- Fallback: "Generation {N}"

## TypeScript DTOs

### FamilyTreeMemberDto
```typescript
{
  id: number;
  fullname: string;
  nickname: string;
  gender: Gender;
  birth_date: Date;
  death_date: Date | null;
  photo_url: string | null;
  bio: string | null;
  spouse_id: number | null;
  father_id: number | null;
  mother_id: number | null;
  children_ids: number[] | null;
}
```

### GenerationDto
```typescript
{
  level: number;
  label: string;
  members: FamilyTreeMemberDto[];
}
```

### FamilyTreeResponseDto
```typescript
{
  generations: GenerationDto[];
  total_members: number;
  total_generations: number;
}
```

## Frontend Integration Guide

### Rendering the Tree

```typescript
// Example React/Vue component logic
function renderFamilyTree(data: FamilyTreeResponseDto) {
  return data.generations.map(generation => (
    <div key={generation.level} className="generation-row">
      <h3>{generation.label}</h3>
      <div className="members">
        {generation.members.map(member => (
          <MemberCard 
            key={member.id}
            member={member}
            spouse={findMemberById(member.spouse_id)}
            children={findMembersById(member.children_ids)}
          />
        ))}
      </div>
    </div>
  ));
}
```

### Building Relationship Lines

```typescript
// Find connections between generations
function buildConnections(generations: GenerationDto[]) {
  const connections = [];
  
  generations.forEach((gen, index) => {
    if (index < generations.length - 1) {
      const nextGen = generations[index + 1];
      
      gen.members.forEach(parent => {
        if (parent.children_ids) {
          parent.children_ids.forEach(childId => {
            connections.push({
              from: parent.id,
              to: childId,
              type: 'parent-child'
            });
          });
        }
      });
    }
  });
  
  return connections;
}
```

### Highlighting Spouse Relationships

```typescript
// Group spouses together visually
function groupSpouses(members: FamilyTreeMemberDto[]) {
  const couples = [];
  const processed = new Set();
  
  members.forEach(member => {
    if (member.spouse_id && !processed.has(member.id)) {
      const spouse = members.find(m => m.id === member.spouse_id);
      if (spouse) {
        couples.push([member, spouse]);
        processed.add(member.id);
        processed.add(spouse.id);
      }
    }
  });
  
  return couples;
}
```

## Example Use Cases

### 1. Display Full Family Tree
```bash
GET /admin/family/tree
```

### 2. Find All Members in a Generation
```typescript
const grandparents = response.generations.find(g => g.label === "Grandparents");
```

### 3. Build Parent-Child Connections
```typescript
const member = // ... find member
const father = allMembers.find(m => m.id === member.father_id);
const mother = allMembers.find(m => m.id === member.mother_id);
```

### 4. Display Siblings
```typescript
function findSiblings(memberId: number, generations: GenerationDto[]) {
  const member = findMemberById(memberId);
  
  return generations
    .flatMap(g => g.members)
    .filter(m => 
      m.id !== memberId &&
      m.father_id === member.father_id &&
      m.mother_id === member.mother_id
    );
}
```

## Performance Considerations

1. **Query Optimization**: The implementation uses TypeORM's query builder with proper joins
2. **Closure Table**: Leverages the closure table for efficient ancestor/descendant queries
3. **Single Response**: All data in one request - no need for multiple API calls
4. **Sorted Data**: Pre-sorted on the backend for immediate frontend rendering

## Swagger Documentation

The API is fully documented in Swagger/OpenAPI:
- Visit `/api` (or your configured Swagger path) to see interactive documentation
- Test the endpoint directly from the Swagger UI
- View request/response schemas

## Testing the API

### Using cURL
```bash
curl -X GET http://localhost:3000/admin/family/tree
```

### Using Postman
1. Create GET request to `http://localhost:3000/admin/family/tree`
2. No body or parameters required
3. Response will be in JSON format

## Future Enhancements

Potential improvements:
1. Add pagination for very large families
2. Filter by specific generation or date range
3. Include member details (profession, contact info)
4. Add generation statistics (avg age, member count)
5. Support for multiple family trees in one system
6. Export to various formats (PDF, PNG, SVG)

## Related Files

- Service: `src/family/family.service.ts`
- Controller: `src/family/controllers/family.admin.controller.ts`
- DTOs: `src/family/dto/member.dto.ts`
- Entities: `src/models/member*.entity.ts`
- Migration: `src/migrations/1733912400000-CreateMemberTables.ts`




