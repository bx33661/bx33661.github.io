# Art Gallery Slider

A full-screen art gallery experience with GSAP-powered horizontal scrolling, dynamic color extraction, and animated ambient backgrounds.

## Features

- **Dynamic Ambient Backgrounds**: Extracts dominant colors from each artwork to create animated gradient backgrounds that shift as you navigate
- **Heavy Drag Interactions**: Smooth drag with resistance and momentum scrolling using Framer Motion
- **Trackpad/Magic Mouse Support**: Horizontal scroll gestures with accumulated delta thresholds
- **Keyboard Navigation**: Arrow keys, A/D, Home/End for full keyboard accessibility
- **Parallax Effects**: Cards shift during drag with parallax motion
- **Hover Animations**: Artwork lifts with slide-up info panels on hover
- **Glassmorphism UI**: Dark editorial aesthetic with blur effects and elegant typography

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Framer Motion (animations, drag gestures)
- GSAP (scroll-triggered animations)
- Tailwind CSS v4
- TypeScript

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout with fonts
│   └── globals.css           # Tailwind config & design tokens
├── components/
│   ├── art-gallery-slider.tsx # Main slider component
│   ├── artwork-card.tsx       # Individual artwork cards
│   └── navigation-dots.tsx    # Navigation indicator
├── hooks/
│   ├── use-slider-navigation.ts # Keyboard & index control
│   ├── use-slider-drag.ts       # Mouse/touch drag logic
│   ├── use-slider-wheel.ts      # Trackpad/scroll handling
│   └── use-color-extraction.ts  # Color management
├── lib/
│   ├── color-extractor.ts    # Canvas-based color extraction
│   └── constants.ts          # Configuration values
├── data/
│   └── artworks.ts           # Artwork data
└── types/
    └── artwork.ts            # TypeScript interfaces
\`\`\`

## Prompt to Recreate

\`\`\`
Build a full-screen art gallery slider with the following features:

1. LAYOUT & DESIGN
- Full viewport height gallery with horizontal card-based slider
- Dark editorial aesthetic (#0a0a0a background)
- Glassmorphism navigation elements with backdrop blur
- Playfair Display for headings, Inter for body text
- Cards sized at 70vh height with 3:4 aspect ratio

2. DYNAMIC AMBIENT BACKGROUNDS
- Extract 3 dominant colors from each artwork image using canvas
- Create animated radial gradient backgrounds using extracted colors
- Smooth 600ms crossfade transitions between backgrounds as slides change
- Colors should be distinct (filter similar colors) and not too light

3. DRAG INTERACTIONS
- Heavy drag feel with 0.4 resistance factor (mouse movement dampened)
- Momentum-based settling with slow easing (0.1 factor)
- Parallax effect on cards during drag (slight horizontal offset based on drag delta)
- Snap to nearest slide on release

4. TRACKPAD/MAGIC MOUSE SUPPORT
- Detect horizontal wheel events (deltaX)
- Accumulate scroll delta with 0.3 resistance
- Trigger slide change when accumulated delta exceeds 120px threshold
- Reset accumulator after 150ms of inactivity

5. KEYBOARD NAVIGATION
- Left/Right arrows and A/D keys for prev/next
- Home/End keys to jump to first/last slide
- Visual hint text showing keyboard controls

6. ARTWORK CARDS
- Image with object-cover fill
- Hover state: lift card with translateY(-8px) and scale(1.02)
- Info panel slides up from bottom on hover (glassmorphism background)
- Display: title, artist name, year
- Prevent text selection on artwork info

7. NAVIGATION DOTS
- Fixed position at bottom center
- Dots use extracted primary color for active state
- Scale animation on active dot
- Click to navigate to specific slide

8. CODE ARCHITECTURE
- Separate custom hooks for: navigation, drag, wheel, color extraction
- Centralized types, constants, and data files
- Clean component composition in main slider
\`\`\`

## License

MIT
