# Workflow Node Internals

## ADDED Requirements

### Requirement: Inspector Shows Node Internals

The Inspector SHALL show an Internals section for supported canonical workflow nodes.

#### Scenario: JIN10 source selected

- GIVEN the user selects `source-jin10`
- WHEN the Inspector Config tab is visible
- THEN the Inspector shows internal steps for fetch, parse, normalize, cache, error handling, and output schema checks

### Requirement: Internals Do Not Expand Canvas

The system SHALL keep the parent canvas readable and SHALL open internals in a nested workspace instead of expanding every internal step inline by default.

#### Scenario: Internals rendered

- GIVEN a canonical node has internals
- WHEN the user opens the Inspector
- THEN the canvas node count does not change

#### Scenario: Dive into network

- GIVEN a canonical node has internals
- WHEN the user double-clicks the node or chooses `Dive into Network`
- THEN the editor shows the node's internal steps in a child workspace
- AND the child workspace shows a breadcrumb and an Up/Esc return path
- AND the internal nodes are locked by default

#### Scenario: Unlock internals

- GIVEN a canonical node has internals
- WHEN the user chooses `Unlock Package`
- THEN the editor creates draft internal nodes
- AND the canonical workflow is not changed until a human accepts the proposal/draft

### Requirement: Internals Are Profile-Aware

The system SHALL resolve internals from the selected workflow node's canonical kind, capability, and catalog id.

#### Scenario: Score node selected

- GIVEN an intelligence `agent/score` node is selected
- WHEN internals are resolved
- THEN the internals describe dimensions, weights, threshold, calibration, explanation, and confidence
