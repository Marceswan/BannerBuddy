# BannerBuddy - Lightning Web Component Documentation

## Overview
BannerBuddy is a flexible Lightning Web Component (LWC) designed to display notification banners in Salesforce. It supports multiple banner variants (Info, Error, Warning, Success), configurable colors, and two display modes:
- **Sticky mode**: one dismissible banner at a time with auto-dismiss queue behavior
- **Ticker mode**: all active banners scroll right-to-left like a news ticker

## Features
- **Dynamic Banner Display**: Fetches active banners from custom object using GraphQL
- **Two Display Modes**: Sticky and Ticker
- **Design Token Presets**: `default`, `compact`, and `broadcast` presets for layout and motion
- **Multiple Variants**: Info, Error, Warning, and Success banner types
- **Customizable Colors**: Configure colors for each variant through component properties
- **Auto-Dismiss (Sticky)**: Banners automatically fade out after 15 seconds
- **Manual Dismiss (Sticky)**: Users can manually dismiss banners with the close button
- **Session Persistence (Sticky)**: Manually dismissed banners remain hidden during the current browser session
- **Edge Fade (Ticker)**: Left and right sides use gradient overlays to fade out content near the edges
- **External Links**: Optional "Learn More" links that open in new tabs
- **Responsive Design**: Sticky uses fixed top positioning; ticker fills 100% of the parent container width

## Component Structure

### Files
- `bannerBuddy.js` - Main JavaScript controller
- `bannerBuddy.html` - Component template
- `bannerBuddy.css` - Component styles
- `bannerBuddy.js-meta.xml` - Component metadata and configuration

### Custom Object: Banner_Buddy__c
The component relies on a custom object with the following fields:
- `Name` - Standard name field
- `Start_Date__c` - Date when banner becomes active
- `End_Date__c` - Date when banner expires
- `Status__c` - Formula field (Scheduled/Active/Expired)
- `Variant__c` - Banner type (Info/Error/Warning/Success)
- `Banner_Title__c` - Main banner heading text
- `Banner_Description__c` - Detailed banner message
- `Links_To__c` - Optional URL for "Learn More" link

## Installation & Setup

### 1. Deploy the Component
Deploy the LWC files to your Salesforce org using SFDX:
```bash
sfdx force:source:deploy -p force-app/main/default/lwc/bannerBuddy
```

### 2. Deploy the Custom Object
Deploy the Banner_Buddy__c custom object and its fields:
```bash
sfdx force:source:deploy -p force-app/main/default/objects/Banner_Buddy__c
```

### 3. Add to Page Layouts
The component can be added to:
- Lightning Home Pages
- Record Pages
- App Pages
- Experience Cloud Pages

## Configuration

### Component Properties
Configure these properties when adding the component to a page:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | String | `sticky` | Display mode (`sticky` or `ticker`) |
| `tokenPreset` | String | `default` | Base design token preset (`default`, `compact`, `broadcast`) |
| `stickyTopOffset` | String | `10px` | Sticky top offset |
| `stickyWidth` | String | `90%` | Sticky width |
| `stickyMaxWidth` | String | `800px` | Sticky maximum width |
| `stickyBorderRadius` | String | `20px` | Sticky border radius |
| `stickyShadow` | String | `0 4px 12px rgba(0, 0, 0, 0.15)` | Sticky shadow |
| `tickerBackgroundColor` | String/Color | `#0f172a` | Ticker container background |
| `tickerTextColor` | String/Color | `#f8fafc` | Ticker text color |
| `tickerEdgeFadeColor` | String/Color | `#0f172a` | Left/right fade overlay color |
| `tickerEdgeFadeWidth` | String | `4.5rem` | Left/right fade overlay width |
| `tickerItemBackgroundColor` | String/Color | `rgba(255, 255, 255, 0.14)` | Ticker item background |
| `tickerSpeedSeconds` | Integer | `28` | Base ticker speed in seconds (lower is faster) |
| `infoColor` | String/Color | `#6d5bf6` | Hex color for Info variant banners |
| `errorColor` | String/Color | `#c23934` | Hex color for Error variant banners |
| `warningColor` | String/Color | `#ff9e2c` | Hex color for Warning variant banners |
| `successColor` | String/Color | `#08ca4a` | Hex color for Success variant banners |

### Adding to Lightning Pages
1. Navigate to Lightning App Builder
2. Edit the desired page (Home, Record, or App Page)
3. Find "Banner Buddy" in the component list
4. Drag and drop onto the page
5. Configure color properties in the properties panel (optional)
6. Save and activate the page

### Adding to Experience Cloud
1. Navigate to Experience Builder
2. Find "Banner Buddy" in the Components panel
3. Drag onto the page
4. Configure colors using the color picker in properties
5. Publish the site

## Creating and Managing Banners

### Creating a New Banner
1. Navigate to the Banner Buddy object (App Launcher → Banner Buddy)
2. Click "New" to create a banner record
3. Fill in the required fields:
   - **Name**: Internal identifier for the banner
   - **Variant**: Choose the banner type (Info, Error, Warning, Success)
   - **Banner Title**: Main heading text
   - **Banner Description**: Detailed message (optional)
   - **Links To**: External URL for "Learn More" link (optional)
   - **Start Date**: When the banner should start displaying
   - **End Date**: When the banner should stop displaying
4. Save the record
5. `Status__c` is computed automatically from Start/End date:
   - `Scheduled` when start date is in the future
   - `Active` when today is within start/end date
   - `Expired` when end date is in the past

### Banner Variants and Use Cases

#### Info (Grey/Purple)
- General announcements
- New feature notifications
- Maintenance schedules
- Policy updates

#### Error (Red)
- System outages
- Critical alerts
- Service disruptions
- Security warnings

#### Warning (Orange)
- Upcoming maintenance
- Deprecation notices
- Important reminders
- Action required notifications

#### Success (Green)
- System restored messages
- Successful deployments
- Achievement notifications
- Positive updates

## Technical Details

### GraphQL Query
The component uses Lightning UI GraphQL API to fetch active banners:
```javascript
query GetActiveBanners {
    uiapi {
        query {
            Banner_Buddy__c(
                where: {
                    Status__c: { eq: "Active" }
                }
                orderBy: {
                    Start_Date__c: { order: DESC }
                }
            ) {
                edges {
                    node {
                        Id
                        Name { value }
                        Start_Date__c { value }
                        End_Date__c { value }
                        Status__c { value }
                        Variant__c { value }
                        Banner_Title__c { value }
                        Banner_Description__c { value }
                        Links_To__c { value }
                    }
                }
            }
        }
    }
}
```

### Dismissal Behavior

Dismissal applies to **sticky mode**.

#### Auto-Dismiss
- Banners automatically fade out after 15 seconds
- CSS animation provides smooth fade effect (visible for 10 seconds, fades over 5 seconds)
- Auto-dismissed banners are temporarily hidden but reappear on page refresh
- Next banner in queue displays after auto-dismiss

#### Manual Dismiss
- Users can click the close button to immediately dismiss
- Manually dismissed banners are saved to sessionStorage
- Remains dismissed for the entire browser session
- Reappears after browser/tab is closed and reopened

### Ticker Behavior
- Ticker mode shows **all active banners** continuously
- Content scrolls right-to-left in a loop
- Ticker fills **100% of the parent container width**
- Left and right edges fade content with gradient overlays

### Storage Options
The component uses `sessionStorage` by default for sticky-mode manual dismiss tracking. To persist dismissals across browser sessions, replace `sessionStorage` with `localStorage` in `bannerBuddy.js`:
```javascript
// Change from:
sessionStorage.getItem('dismissedBanners')
sessionStorage.setItem('dismissedBanners', ...)

// To:
localStorage.getItem('dismissedBanners')
localStorage.setItem('dismissedBanners', ...)
```

### Styling
- Uses SLDS (Salesforce Lightning Design System) classes
- Uses CSS custom properties as design tokens for spacing, sizing, shape, shadows, and motion
- Token presets provide baseline styling; explicit properties override preset values
- Sticky mode uses fixed positioning at top of viewport
- Ticker mode uses 100% width of the containing element

## Best Practices

### Content Guidelines
- **Title**: Keep concise (5-10 words)
- **Description**: Limit to 1-2 sentences
- **Links**: Use meaningful link text in description
- **Timing**: Set appropriate start/end dates

### Performance Considerations
- Component fetches all active banners on load
- GraphQL query is efficient and cached
- Minimal DOM manipulation for dismissals
- Timer cleanup on component destruction

### Accessibility
- Proper ARIA roles and labels
- Screen reader announcements for banner type
- Keyboard accessible dismiss button
- High contrast color defaults

## Troubleshooting

### Banner Not Displaying
1. Verify Start_Date and End_Date make `Status__c` evaluate to `Active`
2. Check Start_Date and End_Date are valid
3. Ensure component is added to the page
4. Check browser console for errors
5. Verify user has read access to Banner_Buddy__c object

### Colors Not Updating
1. Refresh the page after saving configuration
2. Clear browser cache if using Experience Cloud
3. Verify hex color format (e.g., #6d5bf6)
4. Check for CSS overrides in custom themes

### Banner Reappearing After Dismiss
- Expected behavior for auto-dismissed banners
- Manual dismiss persists for session only
- Modify storage method for permanent dismissal

### Links Not Working
1. Verify Links_To__c contains valid URL
2. Include protocol (https://) in URL
3. Check browser popup blocker settings

## Advanced Customization

### Extending Dismissal Duration
Modify the sticky auto-dismiss timeout in `bannerBuddy.js`:
```javascript
// Change from 15 seconds to 30 seconds:
}, 30000); // 30 seconds
```

### Custom Animations
Modify the `fadeOut` animation in `bannerBuddy.css`:
```css
@keyframes fadeOut {
    0% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
}
```

### Adding New Variants
1. Add new variant to Variant__c picklist field
2. Update JavaScript mappings in `bannerBuddy.js`:
   - `bannerClass` getter
   - `bannerStyle` getter
   - `iconName` getter
   - `getTickerItemStyle` method
3. Add corresponding color property to metadata file

## Security Considerations
- Component uses standard Salesforce security model
- Respects object and field-level security
- GraphQL query filtered to active banners only
- External links open in new tab with implied `noopener`
- No direct DOM manipulation or innerHTML usage

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers supported

## Version History
- v1.0 - Initial release with core functionality
  - GraphQL-based data fetching
  - Four banner variants
  - Auto and manual dismiss
  - Session-based dismissal tracking
  - External link support
  - Customizable colors
- v1.1 - Added display modes
  - Introduced `sticky` and `ticker` modes
  - Ticker renders all active records in a continuous scroll
  - Added edge-fade gradients for ticker mode

## Support & Maintenance
For issues or feature requests:
1. Check browser console for errors
2. Verify configuration and setup
3. Review troubleshooting section
4. Contact your Salesforce administrator

## Custom Property Editor
- Implemented for Flow Screen usage via `configurationEditor="c-banner-buddy-property-editor"` on the `lightning__FlowScreen` target.
- The CPE component is: `force-app/main/default/lwc/bannerBuddyPropertyEditor`
- It edits mode and all current design token/variant properties and emits `configuration_editor_input_value_changed` events for Flow Builder.
- Includes a live sticky/ticker preview panel and a "Reset Token Overrides" action to return token fields to the selected preset.
- Lightning App Builder and Experience Builder continue to use native property panels from `bannerBuddy.js-meta.xml`.

## License
Component provided as-is for use within Salesforce orgs. Modify as needed for your organization's requirements.
