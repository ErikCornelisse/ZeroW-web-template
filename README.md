# ZeroW Web Application Template

A configurable web application template for exploring and displaying categorized data. This template was originally based on the Chorizo-actions-explorer and has been refactored into a flexible, configuration-driven application.

## Overview

This template provides a responsive web application that can be easily customized for different projects without modifying the source code. The application's name, content, icons, and data source are all configurable through JSON configuration files.

## Key Features

- **Fully Configurable**: Application name, icons, and content controlled via `app.json`
- **Dynamic Data Loading**: Data source configurable through `data.json`
- **Responsive Design**: Works on desktop and mobile devices
- **Modal System**: Configurable modals for different application states
- **Category-based Navigation**: Displays data organized by categories with icons
- **Progressive Web App**: Includes manifest for PWA functionality

## Configuration

### App Configuration (`app.json`)

The `app.json` file controls the application's appearance and behavior:

```json
{
  "app": {
    "favicon": "images/logos/project-logo-48.png",
    "project_logo": "images/logos/project-logo-48.png", 
    "application_name": "Actions Explorer",
    "data": "data.json"
  },
  "pages": {
    "home": {
      "header": {
        "visible": true,
        "fixed": false,
        "icon": "images/logos/project-logo-48.png",
        "title": "Actions Explorer",
        "modal": "about"
      }
    }
  },
  "modals": {
    // Modal configurations for splash, about, help, settings, home
  },
  "info": {
    // Info card content configuration
  }
}
```

### Data Configuration (`data.json`)

The `data.json` file contains the actual content to be displayed:

```json
{
  "categories": {
    "category-name": [
      {
        "title": "Item Title",
        "description": "Item description",
        // Additional item properties
      }
    ]
  }
}
```

## Getting Started

1. **Clone or download** this template
2. **Customize `app.json`** with your application details:
   - Update application name and title
   - Set your project logo/icon paths
   - Configure modal content
   - Adjust info card content
3. **Prepare your data** in `data.json`:
   - Organize your content by categories
   - Ensure proper JSON structure
4. **Update assets**:
   - Replace logo files in `images/logos/`
   - Add any additional images or assets
5. **Deploy** to your web server

## File Structure

```
├── index.html          # Main HTML file
├── script.js           # Application logic
├── style.css           # Styling
├── app.json           # Application configuration
├── data.json          # Data content
├── manifest.json      # PWA manifest
└── images/
    └── logos/         # Logo and icon assets
```

## Customization

### Changing the Application Name
Update the `pages.home.header.title` value in `app.json`

### Updating Icons and Logos
1. Replace image files in `images/logos/`
2. Update paths in `app.json` under `app.favicon`, `app.project_logo`, and `pages.home.header.icon`

### Modifying Content
- **Info cards**: Update `info` section in `app.json`
- **Modal content**: Update `modals` section in `app.json` 
- **Main data**: Update categories and items in `data.json`

### Changing Data Source
Update the `app.data` field in `app.json` to point to a different JSON file

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **Icons**: Material Icons (included via CDN)
- **Responsive**: CSS Grid and Flexbox
- **PWA Ready**: Includes service worker manifest
- **Browser Support**: Modern browsers (ES6+)

## License

This template is available for use in ZeroW project applications and related initiatives.