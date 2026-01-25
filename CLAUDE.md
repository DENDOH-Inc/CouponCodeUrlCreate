# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository (CouponCodeUrlCreate) is a web-based tool for generating marketing URLs with UTM parameters, coupon codes, and campaign information for fortune-cookie.tokyo. It's designed to be deployed on GitHub Pages as a static website with a fixed base URL of `https://fortune-cookie.tokyo/`.

## Architecture

This is a simple static web application with no build process or dependencies:

- **index.html**: Main HTML structure with form inputs
- **style.css**: Responsive CSS styling
- **script.js**: Vanilla JavaScript for form handling, URL generation, and translation

## Features

- UTM parameter generation (source, medium)
- Coupon code integration
- Date-based campaign versioning
- Japanese to English campaign name translation via MyMemory API
- One-click URL copying
- Google Spreadsheet integration via Google Apps Script
- LocalStorage for Web App URL management

## Translation System

The app uses MyMemory Translation API (free, CORS-enabled, no API key required) for translating Japanese campaign names to English. The translation is automatically sanitized to be URL-safe (alphanumeric characters only).

## Spreadsheet Integration

Optional Google Spreadsheet integration via Google Apps Script:
- Users deploy a Google Apps Script Web App
- The web app receives POST requests with campaign data
- Data is automatically appended to a Google Spreadsheet
- Columns: Date | Campaign Name | Coupon Code | Source | Medium | URL

## Development

No build process required. Simply open `index.html` in a browser or use any HTTP server:

```bash
python -m http.server 8000
```

## Deployment

Deploy to GitHub Pages:
1. Push to GitHub
2. Enable GitHub Pages in repository settings (Settings > Pages)
3. Set source to `main` branch, `/ (root)` folder

## File Structure

```
/
├── index.html       # Main HTML file
├── style.css        # Styling
├── script.js        # Application logic
├── apps-script.gs   # Google Apps Script code for spreadsheet integration
├── README.md        # User documentation
├── CLAUDE.md        # Development documentation
└── .gitignore       # Git ignore rules
```

## Code Conventions

- Use vanilla JavaScript (no frameworks)
- Keep dependencies minimal (currently zero)
- Responsive design with CSS Grid and Flexbox
- Error handling with user-friendly messages
- LocalStorage for client-side persistence
