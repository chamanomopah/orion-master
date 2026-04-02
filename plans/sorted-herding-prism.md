# Implementation Plan: Dynamic Folder Selection

## Context

The current B-view application only works with projects in the hardcoded `projetos/` directory. Users must copy or move files to this location to visualize them. This feature will allow users to select any folder on their system and analyze files from any location without moving them.

## Critical Files to Modify

### New Files to Create
- `backend/path_validator.py` - Path validation with security checks
- `backend/folder_scanner.py` - Folder scanning and file metadata extraction
- `static/js/folder-selector.js` - Folder selection UI component

### Files to Modify
- `app.py` - Add endpoints: `/api/folder/validate`, `/api/folder/scan`, `/api/folder/recent`
- `design.html` - Add folder selector UI above project selector
- `static/js/main.js` - Integrate folder selection, track current folder state
- `static/css/main.css` - Add styles for folder selector component
- `README.md` - Document new feature

## Implementation Steps

### 1. Create backend/path_validator.py
```python
# Functions:
- is_valid_path(path: str) -> bool
- normalize_path(path: str) -> str
- Security checks to prevent path traversal (.. sequences)
- OS-specific path validation
- Check path exists and is accessible directory
```

### 2. Create backend/folder_scanner.py
```python
# Functions:
- scan_folder(folder_path: str, max_depth: int = 1) -> list
- Filter supported file types (using existing detector.py)
- Extract metadata for each file
- Configurable subdirectory handling
```

### 3. Add backend endpoints in app.py
- `POST /api/folder/validate` - Validate and normalize path
- `POST /api/folder/scan` - Scan folder and return file list
- `GET /api/folder/recent` - Get recent folders list
- `POST /api/folder/recent` - Add folder to recent list
- Modify file watcher to accept dynamic folder paths
- Update WebSocket handling for dynamic paths

### 4. Update design.html
- Add folder selector section above project selector
- Add folder input field with browse button
- Add recent folders dropdown
- Add current folder indicator

### 5. Create static/js/folder-selector.js
- Folder selection UI logic
- Recent folders management (localStorage)
- Path validation feedback
- Integration with main.js

### 6. Update static/js/main.js
- Add `currentFolder` state tracking
- Modify `loadProjects()` to use folder scan endpoint
- Update `loadFile()` to work with full paths
- Update WebSocket subscriptions for dynamic paths
- Handle folder changes

### 7. Update static/css/main.css
- Folder selector component styles
- Recent folders dropdown styles
- Current folder indicator styles
- Error message styles

### 8. Update README.md
- Document folder selection feature
- Add usage examples
- Update troubleshooting section

## Security Considerations
- Path validation must prevent `../` traversal attacks
- Consider restricting access to system folders
- Validate all user-provided paths before access

## Verification
1. Start the application: `python app.py`
2. Open browser to http://localhost:8000
3. Use folder selector to pick any folder
4. Verify files are listed and visualizable
5. Check recent folders persists
6. Verify file watcher works with selected folder
7. Test with various folder structures and edge cases
