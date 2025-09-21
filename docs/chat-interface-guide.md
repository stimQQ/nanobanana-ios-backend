# AI Image Generation Chat Interface

## Overview
The image generation interface has been redesigned with a modern chat dialog pattern that provides an intuitive, conversational experience for creating AI-generated images.

## Key Features

### 1. Chat Dialog Interface
- **Conversational Flow**: All interactions follow a chat-like pattern similar to popular messaging applications
- **Message History**: Complete conversation history with timestamps
- **Visual Feedback**: Real-time typing indicators and smooth animations
- **Responsive Design**: Optimized for both desktop and mobile devices

### 2. Generation Modes

#### Text-to-Image Mode (2 credits)
- Enter descriptive prompts to generate images from text
- Focus on detailed descriptions for better results
- No image uploads required

#### Image-to-Image Mode (3 credits)
- **5 Square Image Upload Boxes**: Visual grid layout for reference images
- Upload up to 5 reference images for transformation
- Each box shows:
  - Thumbnail preview when image is uploaded
  - Individual upload button (+ icon)
  - Remove button on hover
  - Image counter (e.g., "Image 1", "Image 2")

### 3. User Interface Components

#### Header Section
- **App Title**: "AI Image Studio" with gradient styling
- **Credits Display**: Real-time credit balance
- **Quick Access**: "Get Credits" button for subscription

#### Message Area
- **User Messages** (Right-aligned, Purple background):
  - Display prompt text
  - Show uploaded reference images (if any)
  - Include generation type indicator
  - Timestamp for each message

- **Assistant Messages** (Left-aligned, White/Gray background):
  - Welcome messages and guidance
  - Generation status with typing animation
  - Generated images with download button
  - Error messages with helpful context
  - Credits used indicator

#### Input Section
- **Mode Selector**: Toggle between Text-to-Image and Image-to-Image
- **Image Upload Grid**: 5 square boxes for image-to-image mode
- **Text Input**: Auto-expanding textarea for prompts
  - Enter to send (Shift+Enter for new line)
  - Clear button (×) when text is present
- **Generate Button**: Disabled when insufficient credits or invalid input
- **Tips Section**: Helpful hints for better results

### 4. Interactive Features

#### Image Upload Process
1. Click any empty square in the grid
2. Select image from device
3. Image uploads automatically and shows preview
4. Hover to see remove option
5. Can replace images by clicking on filled squares

#### Generation Flow
1. Select generation mode (Text-to-Image or Image-to-Image)
2. For Image-to-Image: Upload 1-5 reference images
3. Enter descriptive prompt
4. Click Generate or press Enter
5. See typing animation while generating
6. View generated image in chat
7. Download or generate new image

### 5. Responsive Design

#### Mobile Optimizations
- Compact header with abbreviated labels
- Touch-friendly buttons and inputs
- Optimized image grid for smaller screens
- Simplified tips section

#### Desktop Features
- Full-width message area
- Detailed labels and descriptions
- Hover effects and animations
- Extended tip information

## Technical Implementation

### State Management
```typescript
interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content?: string;
  prompt?: string;
  imageUrl?: string;
  inputImages?: string[];
  timestamp: Date;
  isGenerating?: boolean;
  error?: string;
  generationType?: GenerationType;
  creditsUsed?: number;
}
```

### Key Functions
- `handleImageUpload`: Manages image uploads to specific grid positions
- `handleGenerate`: Processes generation requests and updates chat
- `scrollToBottom`: Auto-scrolls to latest messages
- `adjustTextareaHeight`: Dynamic input field sizing

### Animations
- `fadeIn`: Message appearance animation
- `typing`: Three-dot loading indicator
- `transition-all`: Smooth hover and state changes

## Usage Tips

### For Best Results
1. **Be Specific**: Include details about style, lighting, composition
2. **Use Keywords**: Add style modifiers like "photorealistic", "oil painting"
3. **Reference Quality**: For image-to-image, use clear, high-quality reference images
4. **Experiment**: Try different prompts and combinations

### Common Workflows

#### Creating Art from Text
1. Select "Text to Image" mode
2. Describe your vision in detail
3. Press Enter to generate
4. Download or refine with new prompt

#### Transforming Existing Images
1. Select "Image to Image" mode
2. Upload 1-5 reference images
3. Describe the transformation you want
4. Generate and iterate as needed

## Error Handling
- Insufficient credits: Link to subscription page
- Upload failures: Retry with error message
- Generation failures: Clear error feedback
- Network issues: Automatic retry logic

## Accessibility Features
- Keyboard navigation support
- Screen reader compatible labels
- High contrast mode support
- Focus indicators on interactive elements