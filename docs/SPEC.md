PROJECT: ELEKTROPLAN

ROLE

You are a Senior Software Architect, Senior Full-Stack Engineer, UI/UX Designer, and Professional Frontend Developer.

Your task is to build a production-quality application named ELEKTROPLAN.

This is a professional electrical installation planning application designed for electricians.

You must follow the architecture, visual requirements, functional requirements, and development phases described below.

Do not simplify the project without permission.

Do not replace real functionality with visual placeholders.

1. PRODUCT VISION

Build a professional 2D electrical project planning system.

The electrician must be able to:

1. Create a new project.
2. Draw a visual floor plan containing rooms.
3. Name each room.
4. Add electrical symbols to walls.
5. Configure every electrical point.
6. Save the project.
7. Open the project during installation.
8. Mark electrical points as completed.
9. Export the project as PDF.

IMPORTANT:

This is NOT a construction CAD application.

Do not build complicated architectural measurement systems.

Do not require real room dimensions, square meters, or precise building measurements.

The floor plan is a visual representation of rooms.

Electrical point properties may contain optional mounting heights and distances.

2. DESIGN REFERENCE

Use the user-provided ELEKTROPLAN dashboard image as the primary visual reference.

Reproduce its overall appearance as closely as possible.

Visual requirements:

* Premium dark interface.
* Deep navy and black background.
* Electric blue primary accents.
* Glass-style panels.
* Rounded cards.
* Subtle shadows.
* Professional icons.
* Clean typography.
* Modern animations.
* High-quality visual hierarchy.

The application must look like professional desktop software.

Do not create a generic admin dashboard.

Do not redesign the interface independently.

3. MAIN APPLICATION LAYOUT

LEFT SIDEBAR:

* Dashboard
* Projects
* Drawing
* Installation Mode
* Materials
* Settings

TOP HEADER:

* Project name
* Customer name
* Address
* Save button
* PDF export
* Installation mode button

CENTER:

* Interactive floor plan canvas.
* Room shapes.
* Electrical symbols.
* Drawing toolbar.

RIGHT SIDEBAR:

* Selected point properties.
* Symbol type.
* Mounting height.
* Position.
* Description.
* Color.
* Delete.
* Duplicate.

BOTTOM:

* Room list.
* Wall elevation preview.
* Project completion status.

4. TECHNOLOGY STACK

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Konva.js
* Zustand
* PostgreSQL
* Prisma ORM
* IndexedDB
* Auth.js
* PWA

Use modular architecture.

Do not place the entire application inside one component.

5. FLOOR PLAN EDITOR

Create an interactive 2D editor.

Features:

* Draw rectangular rooms.
* Draw square rooms.
* Draw freeform rooms.
* Add walls.
* Delete walls.
* Move walls.
* Rename rooms.
* Change room colors.
* Duplicate rooms.
* Delete rooms.
* Zoom in/out.
* Pan canvas.
* Undo/Redo.
* Select objects.
* Multi-select objects.

The canvas must support mouse, touch, and stylus interaction.

Room dimensions must not be mandatory.

6. ELECTRICAL SYMBOL LIBRARY

Create a reusable SVG symbol library.

Initial symbols:

* Single socket.
* Double socket.
* Triple socket.
* Light switch.
* Double switch.
* Internet point.
* TV point.
* Ceiling light.
* LED lighting.
* Air conditioner point.
* Custom point.

Each symbol must have:

* Unique ID.
* Name.
* Category.
* SVG icon.
* Default color.
* Editable properties.

Symbols must be draggable and attachable to walls.

7. ELECTRICAL POINT PROPERTIES

Each electrical point must support:

* Symbol type.
* Room ID.
* Wall ID.
* X position.
* Y position.
* Mounting height.
* Distance from wall corner.
* Description.
* Color.
* Installation status.

Allow all properties to be edited.

8. WALL VIEW

Implement a dedicated wall elevation preview.

When a wall is selected:

* Display the wall in a separate horizontal view.
* Show all electrical points on that wall.
* Display their relative positions.
* Display mounting heights.
* Allow point selection.
* Allow point editing.
* Keep the wall view synchronized with the main canvas.

This feature is essential.

9. INSTALLATION MODE

Create a dedicated installation interface.

Show:

* Project floor plan.
* Room navigation.
* Electrical points.
* Wall views.
* Completion status.

Each point has three states:

* Pending.
* In progress.
* Completed.

Automatically calculate:

* Total points.
* Completed points.
* Remaining points.
* Completion percentage.

Never lose installation progress.

10. DATA ARCHITECTURE

Create normalized database models:

* User
* Project
* Room
* Wall
* ElectricalPoint
* Symbol
* InstallationTask
* ProjectHistory
* ProjectSettings

Use UUID identifiers.

Implement timestamps.

Use proper relations and indexes.

11. STORAGE

Implement:

* IndexedDB local persistence.
* Server-side PostgreSQL persistence.
* Automatic saving.
* Background synchronization.
* Offline editing.
* Conflict handling.

The application must not lose user data if the browser is refreshed or temporarily disconnected.

12. PDF EXPORT

Generate professional PDF documents.

Include:

* Project information.
* Floor plan.
* Room names.
* Electrical symbols.
* Electrical point list.
* Wall elevations.
* Mounting heights.
* Installation progress.

13. RESPONSIVE DESIGN

Desktop:
Full professional dashboard.

Tablet:
Optimized drawing workspace.

Mobile:
Touch-friendly interface with collapsible panels and simplified navigation.

Do not simply scale the desktop interface down.

Redesign panel behavior for smaller screens while preserving the same visual identity.

14. CODE QUALITY

Requirements:

* Strict TypeScript.
* Reusable components.
* Modular architecture.
* Clear naming.
* Error handling.
* Input validation.
* Unit tests.
* Integration tests.
* No unnecessary dependencies.
* No duplicated business logic.

Every visible button must perform its intended action.

Do not create fake functionality.

15. DEVELOPMENT WORKFLOW

Build the project in phases.

PHASE 1:
Initialize the project and implement the complete dashboard design.

PHASE 2:
Implement project creation and management.

PHASE 3:
Build the floor plan drawing engine.

PHASE 4:
Implement rooms and walls.

PHASE 5:
Build the SVG electrical symbol library.

PHASE 6:
Implement electrical point placement and editing.

PHASE 7:
Implement the wall elevation view.

PHASE 8:
Implement automatic saving and local storage.

PHASE 9:
Implement installation mode.

PHASE 10:
Implement PDF export.

PHASE 11:
Implement PWA and offline functionality.

PHASE 12:
Implement PostgreSQL synchronization and authentication.

PHASE 13:
Run comprehensive tests and optimize the application.

After each phase:

1. Test the implementation.
2. Fix errors.
3. Verify existing functionality.
4. Update documentation.
5. Report completed work.
6. Wait for approval before moving to the next phase.

16. STRICT RULES

Do not skip phases.

Do not create the entire application in one giant file.

Do not use static screenshots as the application interface.

Do not use a flat image instead of a real interactive floor plan.

Do not use emoji as electrical symbols.

Do not remove requested functionality.

Do not change the approved visual design.

Do not invent unnecessary features.

Prioritize usability, visual quality, stability, and maintainability.

FINAL OBJECTIVE

Deliver a professional, fully functional ELEKTROPLAN application.

The final result must closely match the user’s approved visual reference and provide a practical electrical planning and installation workflow.

Start with PHASE 1 only.

First inspect the project environment, create the architecture, and implement the visual dashboard.

Do not proceed to PHASE 2 until PHASE 1 has been tested and approved.