# TDD Test Suite for Kanban Board

This test suite demonstrates **Test-Driven Development (TDD)** principles for a Kanban board application. It's designed for training purposes to showcase how TDD guides implementation and ensures code quality.

## 🎯 **TDD Philosophy Demonstrated**

### Red-Green-Refactor Cycle
```
🔴 RED   → Write failing tests that define desired behavior
🟢 GREEN → Write minimal code to make tests pass  
🔵 BLUE  → Refactor code while keeping tests green
```

### Test Categories Overview

| Layer | Test Files | Purpose | TDD Benefit |
|-------|------------|---------|-------------|
| **API** | `apps/api/src/__tests__/boards.test.ts` | HTTP endpoints | Drives API contract design |
| **Service** | `apps/api/src/__tests__/services/board.service.test.ts` | Business logic | Guides service architecture |
| **Components** | `apps/web/src/__tests__/components/Board.test.tsx` | UI behavior | Ensures user interactions work |
| **E2E** | `e2e/board-management.spec.ts` | Full workflows | Validates complete user journeys |

---

## 🚀 **Running the Tests**

### All Tests
```bash
pnpm test
```

### Individual Test Suites
```bash
# API tests
pnpm test:api

# Frontend component tests  
pnpm test:unit

# End-to-end tests
pnpm test:e2e

# Type checking
pnpm typecheck
```

### With Coverage
```bash
pnpm test:coverage
```

---

## 📋 **Test Structure & TDD Examples**

### 1. **API Layer Tests** - `apps/api/src/__tests__/boards.test.ts`

**🎯 TDD Benefit**: Drives API design before implementation

```typescript
describe('POST /api/boards', () => {
  it('should create a new board with default title and columns', async () => {
    // 🔴 RED: This test will fail initially
    const response = await app.inject({
      method: 'POST',
      url: '/api/boards',
      payload: {}
    });

    // 🟢 GREEN: Forces implementation of:
    // - POST /api/boards route
    // - Board creation logic
    // - Default column generation
    expect(response.statusCode).toBe(201);
    expect(body.data.id).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(body.data.title).toBe('My Kanban Board');
  });
});
```

**What this test drives**:
- ✅ Route handler implementation
- ✅ nanoid ID generation
- ✅ Default board structure
- ✅ Response format

### 2. **Service Layer Tests** - `apps/api/src/__tests__/services/board.service.test.ts`

**🎯 TDD Benefit**: Guides clean architecture and business logic

```typescript
describe('BoardService', () => {
  it('should create default columns (Todo, In Progress, Done)', async () => {
    // 🔴 RED: Drives service design
    const board = await boardService.createBoard({});
    const fullBoard = await boardService.getBoardById(board.id);

    // 🟢 GREEN: Forces implementation of:
    // - Service layer abstraction
    // - Database operations
    // - Data relationships
    expect(fullBoard.columns).toHaveLength(3);
    expect(fullBoard.columns[0].title).toBe('Todo');
    expect(fullBoard.columns[1].title).toBe('In Progress');
    expect(fullBoard.columns[2].title).toBe('Done');
  });
});
```

**What this test drives**:
- ✅ Service layer architecture
- ✅ Database schema relationships
- ✅ Business rule enforcement
- ✅ Data consistency

### 3. **Component Tests** - `apps/web/src/__tests__/components/Board.test.tsx`

**🎯 TDD Benefit**: Ensures UI behavior and user interactions

```typescript
describe('Board Component', () => {
  it('should allow adding new card to column', async () => {
    // 🔴 RED: Drives component design
    mockBoardStore.board = mockBoard;
    const user = userEvent.setup();

    render(<Board boardId="test-id" />);
    
    const addButton = screen.getAllByRole('button', { name: /add card/i })[0];
    await user.click(addButton);

    // 🟢 GREEN: Forces implementation of:
    // - Add card UI
    // - Event handlers
    // - State management
    expect(mockBoardStore.addCard).toHaveBeenCalledWith('col-1');
  });
});
```

**What this test drives**:
- ✅ Component interfaces
- ✅ User interaction handlers
- ✅ State management integration
- ✅ Accessibility features

### 4. **E2E Tests** - `e2e/board-management.spec.ts`

**🎯 TDD Benefit**: Validates complete user workflows

```typescript
test('complete card management workflow', async ({ page }) => {
  // 🔴 RED: Drives full integration
  await page.goto('/');
  await page.getByRole('button', { name: /create your first board/i }).click();

  await page.locator('[data-testid="board-column"]').first()
    .getByRole('button', { name: /add card/i }).click();
  
  await page.getByPlaceholder(/enter card content/i).fill('My first task');
  await page.getByPlaceholder(/enter card content/i).press('Enter');
  
  // 🟢 GREEN: Validates end-to-end flow
  await expect(page.getByText('My first task')).toBeVisible();
});
```

**What this test drives**:
- ✅ Complete user journeys
- ✅ Integration between layers
- ✅ Real browser behavior
- ✅ Accessibility compliance

---

## 🔥 **Key TDD Principles Demonstrated**

### 1. **Tests as Documentation**
Each test clearly describes expected behavior:
```typescript
// ✅ GOOD: Clear, behavior-focused name
it('should create board with default columns (Todo, In Progress, Done)')

// ❌ BAD: Implementation-focused name  
it('should call prisma.board.create with columns array')
```

### 2. **Arrange-Act-Assert Pattern**
```typescript
it('should update board title', async () => {
  // 🔧 ARRANGE: Set up test data
  const createdBoard = await boardService.createBoard({ title: 'Original' });
  const updateData = { title: 'Updated Title', columns: [] };

  // ⚡ ACT: Perform the action
  await boardService.updateBoard(createdBoard.id, updateData);

  // ✅ ASSERT: Verify the outcome
  const updatedBoard = await boardService.getBoardById(createdBoard.id);
  expect(updatedBoard.title).toBe('Updated Title');
});
```

### 3. **Test Isolation**
```typescript
beforeEach(async () => {
  // Clean slate for each test
  vi.clearAllMocks();
  await prisma.card.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
});
```

### 4. **Progressive Complexity**
```
Level 1: Unit tests (individual functions)
Level 2: Integration tests (service + database)  
Level 3: Component tests (UI + state)
Level 4: E2E tests (full application)
```

---

## 🎓 **Learning Path for TDD Training**

### **Phase 1: Start with API Tests** (Week 1)
1. Run `pnpm test:api` - All tests should fail ❌
2. Implement one route at a time to make tests pass ✅
3. Refactor code while keeping tests green 🔄

### **Phase 2: Add Service Layer** (Week 2)
1. Run service tests - They'll fail ❌
2. Create `BoardService` class with required methods ✅
3. Implement database operations to satisfy tests 🔄

### **Phase 3: Build UI Components** (Week 3)
1. Run component tests - They'll fail ❌
2. Create React components with required props ✅
3. Add event handlers and state management 🔄

### **Phase 4: Validate with E2E** (Week 4)
1. Run E2E tests - They'll fail ❌
2. Connect all layers together ✅
3. Fix integration issues and edge cases 🔄

---

## 🛠 **TDD Best Practices Shown**

### ✅ **DO's**
- Write tests before implementation
- Use descriptive test names
- Test behavior, not implementation
- Keep tests simple and focused
- Use proper mocking/stubbing

### ❌ **DON'Ts**
- Don't test implementation details
- Don't write tests after code
- Don't make tests dependent on each other
- Don't ignore failing tests
- Don't over-mock

---

## 📊 **Coverage Goals**

| Test Type | Coverage Target | Rationale |
|-----------|----------------|-----------|
| **API Routes** | 95%+ | Critical business logic |
| **Service Layer** | 90%+ | Data integrity |
| **UI Components** | 80%+ | User interactions |
| **E2E Flows** | 100% | Happy paths |

---

## 🎯 **Training Exercises**

### **Exercise 1: Red-Green-Refactor**
1. Pick one failing test from `boards.test.ts`
2. Implement minimal code to make it pass
3. Refactor to improve code quality
4. Ensure all tests still pass

### **Exercise 2: Add New Feature**
1. Write tests for card drag-and-drop
2. Watch tests fail (Red)
3. Implement feature (Green)
4. Refactor for better UX (Blue)

### **Exercise 3: Debug with Tests**
1. Break existing functionality
2. Watch tests fail and identify issue
3. Fix implementation
4. Verify tests pass

---

## 🚀 **Ready to Start!**

This test suite provides a complete foundation for learning TDD. Each test is carefully crafted to demonstrate:

- How tests drive design decisions
- The importance of clear test names
- Proper mocking and isolation
- Progressive complexity building
- Real-world TDD workflows

**Happy Test-Driven Development!** 🎉

---

*This test suite is designed for educational purposes and demonstrates TDD principles. In a production environment, you would implement the actual functionality to make these tests pass.* 