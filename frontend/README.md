<p align="center">
  <img src="./src/logo/logo-with-name.svg" alt="Parallelpedia" height="56" />
  <br />
  <sub><em>beta</em></sub>
</p>

# Parallelpedia Frontend

React + Vite + TypeScript frontend for Parallelpedia - a tool for comparing AI-generated encyclopedias (Grokipedia) with Wikipedia.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```bash
cp .env.example .env
# Edit .env if your backend is running on a different URL
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

**Note**: The development server also includes a proxy configuration in `vite.config.ts` that forwards `/api` requests to the backend.

3. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Architecture

The frontend is built with:

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **React Router** - Routing

### Project Structure

```
src/
├── App.tsx                    # Main application component
├── main.tsx                   # Application entry point
├── components/                # Reusable UI components
│   ├── ArticleView.tsx        # Basic article display
│   ├── DifferenceTooltip.tsx  # Tooltip showing segment comparison details
│   ├── HighlightedArticleView.tsx  # Article with color-coded highlights
│   ├── SegmentComparison.tsx  # Individual segment comparison card
│   └── TrustScore.tsx         # Trust score badge component
├── pages/                     # Page components
│   └── LandingPage.tsx       # Landing page
├── services/                  # API service layer
│   └── api.ts                # Backend API client
├── types.ts                   # TypeScript type definitions
├── utils/                     # Utility functions
│   └── textHighlighting.ts   # Text highlighting and matching logic
└── logo/                      # Logo assets
```

## How It Works

### Application Flow

1. **User Input**: User enters a topic ID (e.g., `Climate_change`) in the search input
2. **Article Fetching**: Frontend fetches both Grokipedia and Wikipedia articles in parallel
3. **Comparison**: Frontend calls the comparison API endpoint
4. **Display**: Results are displayed with:
   - Trust score and summary
   - Side-by-side article comparison with highlights
   - Tabbed analysis view (Evidence, Conflicts, Alignments)
5. **Publishing**: User can publish Community Note to DKG

### API Integration

The frontend communicates with the backend through the API service (`src/services/api.ts`):

#### API Methods

- **`getGrokArticle(topicId)`**: Fetches Grokipedia article
- **`getWikipediaArticle(topicId)`**: Fetches Wikipedia article
- **`compareTopic(topicId)`**: Runs comparison analysis
- **`publishCommunityNote(topicId)`**: Publishes Community Note to DKG
- **`getCommunityNote(topicId)`**: Retrieves published Community Note

All API calls use Axios with a base URL configured from `VITE_API_URL` environment variable.

### How Comparison Results Are Displayed

#### 1. Trust Score & Summary

- **Trust Score Component**: Displays score (0-100) with color coding:
  - Green (≥80): High trust
  - Yellow (60-79): Moderate trust
  - Orange (40-59): Low trust
  - Red (<40): Very low trust

- **Summary**: Human-readable analysis summary from backend
- **Label Counts**: Grid showing counts for:
  - Aligned segments (green)
  - Missing Context segments (yellow)
  - Conflicts (red)
  - Unsupported segments (gray)

#### 2. Side-by-Side Article View

The `HighlightedArticleView` component displays articles with:

- **Color-Coded Highlights**: 
  - **Red**: Conflicts
  - **Yellow**: Missing context
  - **Gray**: Unsupported content
  - **Green**: Aligned (shown in analysis tabs)

- **Interactive Tooltips**: Click on highlighted segments to see:
  - Similarity score
  - Full Grokipedia segment text
  - Matched Wikipedia segment(s)
  - Label classification

- **Synchronized Scrolling**: Both article views scroll together for easy comparison

- **Source Links**: Direct links to original articles

#### 3. Tabbed Analysis View

Three tabs provide different views of the analysis:

1. **Evidence Tab**: All segment comparisons with full details
2. **Conflicts Tab**: Filtered view showing only conflicting segments
3. **Alignments Tab**: Filtered view showing only aligned segments

Each segment comparison card shows:
- Label badge with color coding
- Similarity score percentage
- Full segment text
- Matched Wikipedia sentences (if available)

### Text Highlighting System

The `textHighlighting.ts` utility handles:

1. **Segment Matching**: Finds segment text positions in article text using:
   - Normalized text comparison (handles whitespace, quotes)
   - Fuzzy matching for partial matches
   - Position mapping back to original text

2. **Highlight Creation**: Creates highlighted segments with:
   - Start/end positions
   - Label classification
   - Reference to comparison data

3. **Text Splitting**: Splits article text into parts:
   - Highlighted parts (with segment data)
   - Regular text parts

### How Community Notes Are Published

#### Publishing Flow

1. **User Action**: User clicks "Publish Community Note to DKG" button
2. **API Call**: Frontend calls `publishCommunityNote(topicId)`
3. **Loading State**: Button shows "Publishing..." and is disabled
4. **Success**: Button changes to "✓ Published to DKG" and is disabled
5. **Error Handling**: Shows alert if publishing fails

**Note**: Publishing can take several minutes due to blockchain operations. The button remains disabled during this time.

#### Publishing Requirements

- Analysis must be completed first
- Backend must be running and connected to DKG node
- DKG node must be properly configured

### Component Details

#### `App.tsx` (Main Component)

- Manages application state (topic, articles, analysis, loading states)
- Handles user interactions (compare, publish)
- Renders main UI layout
- Coordinates between components

**Key State:**
- `topicId`: Current topic being analyzed
- `analysis`: Comparison results from backend
- `grokArticle` / `wikiArticle`: Article data
- `loading`: Comparison in progress
- `publishing`: Publishing in progress
- `published`: Publishing completed
- `activeTab`: Current analysis tab

#### `HighlightedArticleView`

**Props:**
- `article`: Article data to display
- `title`: Display title
- `comparisons`: Array of segment comparisons
- `source`: 'grok' or 'wiki'
- `scrollContainerRef`: Ref for synchronized scrolling
- `syncScroll`: Enable scroll synchronization

**Features:**
- Renders article text with color-coded highlights
- Shows legend for color meanings
- Handles click events on highlighted segments
- Displays tooltips via React Portal
- Manages scroll synchronization

#### `SegmentComparison`

**Props:**
- `comparison`: SegmentComparison object

**Features:**
- Color-coded border and background based on label
- Displays label text with icon
- Shows similarity score
- Displays segment text
- Shows matched Wikipedia sentences (if available)

#### `TrustScore`

**Props:**
- `score`: Trust score (0-100)
- `size`: 'sm' | 'md' | 'lg'

**Features:**
- Color-coded based on score thresholds
- Responsive sizing
- Formatted display with "/100" suffix

#### `DifferenceTooltip`

**Props:**
- `comparison`: SegmentComparison object
- `anchorElement`: DOM element to anchor tooltip
- `onClose`: Close handler

**Features:**
- Positioned relative to clicked segment
- Shows similarity score badge
- Displays Grokipedia segment
- Shows matched Wikipedia segments
- Arrow pointing to anchor element
- Click outside to close

### Routing

The application uses React Router with two routes:

- **`/`**: Landing page (`LandingPage.tsx`)
- **`/app`**: Main application (`App.tsx`)

## Features

### Core Features

- **Side-by-Side Comparison**: View Grokipedia and Wikipedia articles simultaneously
- **Color-Coded Analysis**: Visual indicators for different segment types
- **Interactive Highlights**: Click segments to see detailed comparisons
- **Trust Score Visualization**: Clear visual representation of content reliability
- **Tabbed Analysis**: Filtered views for different types of segments
- **Community Note Publishing**: One-click publishing to DKG blockchain
- **Responsive Design**: Works on desktop and mobile devices
- **Synchronized Scrolling**: Both articles scroll together for easy comparison

### UI/UX Features

- **Loading States**: Clear feedback during API calls
- **Error Handling**: User-friendly error messages
- **Empty States**: Helpful guidance when no data is available
- **Tooltips**: Detailed information on demand
- **Color Legend**: Clear explanation of color coding
- **Source Links**: Direct access to original articles

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Development Server

The Vite dev server includes:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- API proxy configuration (forwards `/api` to backend)

### TypeScript

The project uses TypeScript for type safety. Type definitions are in:
- `src/types.ts`: Main type definitions
- Component props are typed
- API responses are typed

## Error Handling

### Common Errors

1. **Article Not Found (404)**:
   - Shows alert with helpful message
   - Suggests checking topic ID format
   - Reminds user to verify articles exist

2. **Backend Not Available**:
   - Network errors are caught and displayed
   - User is informed to check backend status

3. **Publishing Failures**:
   - Alert shown with error message
   - User can retry publishing

### Error Display

- Alerts for critical errors
- Console logging for debugging
- Graceful degradation (partial data still shown if available)

## Styling

The project uses **TailwindCSS** for styling:

- Utility-first CSS framework
- Responsive design utilities
- Custom color palette for segment labels
- Consistent spacing and typography

### Color Scheme

- **Green**: Aligned segments, high trust scores
- **Yellow**: Missing context segments, moderate trust
- **Red**: Conflicts, low trust scores
- **Gray**: Unsupported segments
- **Purple**: Primary brand color, buttons
- **Blue**: Links, Wikipedia highlights

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features required
- React 18 features used

## Performance Considerations

- **React.memo**: Used in `HighlightedArticleView` to prevent unnecessary re-renders
- **Lazy Loading**: Consider implementing for large article sets
- **Virtual Scrolling**: Could be added for very long segment lists
- **API Caching**: Could cache article data to reduce API calls

