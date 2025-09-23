'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Toast, useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';
import type { GenerationType } from '@/lib/types/database';
import Link from 'next/link';
import { compressImage, formatFileSize } from '@/lib/utils/image-compression';
import { downloadImage, shareImage, isMobileDevice } from '@/lib/utils/image-actions';
import {
  getLocalizedMessage,
  getUserLanguage,
  generationSuccessMessages,
  welcomeMessages,
  errorMessages,
  processingMessages
} from '@/lib/utils/messages';

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

export default function GeneratePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [generationType, setGenerationType] = useState<GenerationType>('text-to-image'); // Default to text-to-image
  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [userLanguage, setUserLanguage] = useState<string>('en');
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const { toasts, showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history when user is authenticated and detect language
  useEffect(() => {
    if (isAuthenticated && user && !authLoading && !hasLoadedHistory) {
      loadChatHistory();
    }

    // Detect and set user language
    const lang = getUserLanguage();
    setUserLanguage(lang);
    // Detect if mobile device
    setIsMobile(isMobileDevice());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading, hasLoadedHistory]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await apiClient.getChatMessages();

      if (response.messages && response.messages.length > 0) {
        // Convert database messages to UI messages
        const loadedMessages: Message[] = response.messages.map(msg => ({
          id: msg.id,
          type: msg.message_type,
          content: msg.content,
          prompt: msg.prompt,
          imageUrl: msg.image_url,
          inputImages: msg.input_images,
          timestamp: new Date(msg.created_at),
          generationType: msg.generation_type,
          creditsUsed: msg.credits_used,
          error: msg.error_message,
        }));
        setMessages(loadedMessages);
        setSessionId(response.session_id);
      } else {
        // No history, show welcome message
        const welcomeMessage: Message = {
          id: 'welcome-' + Date.now(),
          type: 'assistant',
          content: getLocalizedMessage(welcomeMessages, userLanguage),
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        // Save welcome message to database
        if (response.session_id) {
          setSessionId(response.session_id);
          await apiClient.saveChatMessage({
            message_type: 'assistant',
            content: welcomeMessage.content,
            session_id: response.session_id,
          });
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Show welcome message on error
      setMessages([{
        id: 'welcome-' + Date.now(),
        type: 'assistant',
        content: getLocalizedMessage(welcomeMessages, userLanguage),
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoadingHistory(false);
      setHasLoadedHistory(true);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, _index?: number) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      // Handle multiple file uploads with compression
      const uploadPromises = files.slice(0, 5 - uploadedImages.filter(img => img).length).map(async (file, idx) => {
        try {
          // Show original size
          console.log(`Uploading ${file.name}: ${formatFileSize(file.size)}`);

          // Compress the image before upload
          const compressedFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            maxSizeMB: 2
          });

          console.log(`Compressed ${file.name}: ${formatFileSize(compressedFile.size)}`);

          // Update progress
          setUploadProgress((idx + 0.5) / files.length * 100);

          const response = await apiClient.uploadImage(compressedFile);

          // Update progress
          setUploadProgress((idx + 1) / files.length * 100);

          return response.image_url;
        } catch (err) {
          console.error('Upload error for file:', file.name, err);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUploads = uploadedUrls.filter(url => url !== null);

      if (successfulUploads.length > 0) {
        setUploadedImages((prev) => {
          const currentImages = prev.filter(img => img);
          const newImages = [...currentImages, ...successfulUploads].slice(0, 5);
          return newImages;
        });

        if (successfulUploads.length < uploadedUrls.length) {
          setError(`${uploadedUrls.length - successfulUploads.length} image(s) failed to upload`);
        }
      } else {
        setError('Failed to upload images. Please try again.');
      }

      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadedImages]);

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleEditAgain = (originalPrompt: string, generatedImageUrl: string) => {
    // Always switch to image-to-image mode when editing a generated image
    setGenerationType('image-to-image');

    // Set the prompt
    setPrompt(originalPrompt);

    // Use the generated image as the new input image
    setUploadedImages([generatedImageUrl]);

    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
        // Scroll to the input area
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    const actualImages = uploadedImages.filter(img => img);
    if (generationType === 'image-to-image' && actualImages.length === 0) {
      setError('Please upload at least one image for image-to-image generation');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsSidebarOpen(false); // Close sidebar on mobile after generating

    const currentPrompt = prompt; // Store the current prompt for use in the response
    const currentGenerationType = generationType; // Store the current generation type

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      prompt: currentPrompt,
      inputImages: actualImages.length > 0 ? actualImages : undefined,
      timestamp: new Date(),
      generationType: currentGenerationType,
    };

    const generatingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      isGenerating: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, generatingMessage]);
    setPrompt('');
    setUploadedImages([]);

    // Save user message to database
    try {
      await apiClient.saveChatMessage({
        message_type: 'user',
        prompt: currentPrompt,
        input_images: actualImages.length > 0 ? actualImages : undefined,
        generation_type: currentGenerationType,
        session_id: sessionId || undefined,
      });
    } catch (saveError) {
      console.error('Error saving user message:', saveError);
    }

    try {
      const response = await apiClient.generateImage({
        prompt: currentPrompt,
        generation_type: currentGenerationType,
        input_images: currentGenerationType === 'image-to-image' ? actualImages : undefined,
      });

      if (response.success && response.image_url) {
        const assistantMessage = {
          ...generatingMessage,
          isGenerating: false,
          imageUrl: response.image_url,
          creditsUsed: response.credits_used,
          content: getLocalizedMessage(generationSuccessMessages, userLanguage),
          prompt: currentPrompt,
          generationType: currentGenerationType,
          inputImages: actualImages.length > 0 ? actualImages : undefined,
        };

        setMessages(prev => prev.map(msg =>
          msg.id === generatingMessage.id ? assistantMessage : msg
        ));

        // Show success toast with gallery link
        showToast(
          <div className="flex items-center justify-between w-full">
            <span>✨ Image generated successfully!</span>
            <Link
              href="/gallery"
              className="ml-3 px-3 py-1 bg-[#FFD700] text-black rounded-md hover:bg-[#DAA520] transition-colors font-medium text-sm"
            >
              View in Gallery →
            </Link>
          </div>,
          'success'
        );

        // Save assistant message with generated image to database
        try {
          console.log('📝 [GENERATE PAGE] Attempting to save chat message:', {
            hasImageUrl: !!response.image_url,
            imageUrlLength: response.image_url?.length,
            imageUrlPreview: response.image_url?.substring(0, 100),
            generationId: response.generation_id,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
          });

          const saveResult = await apiClient.saveChatMessage({
            message_type: 'assistant',
            content: assistantMessage.content,
            image_url: response.image_url,
            prompt: currentPrompt,
            input_images: actualImages.length > 0 ? actualImages : undefined,
            generation_type: currentGenerationType,
            generation_id: response.generation_id,
            credits_used: response.credits_used,
            session_id: sessionId || undefined,
          });

          console.log('✅ [GENERATE PAGE] Chat message saved:', {
            success: saveResult?.success,
            messageId: saveResult?.message?.id,
            sessionId: saveResult?.session_id
          });
        } catch (saveError) {
          console.error('❌ [GENERATE PAGE] Failed to save assistant message:', {
            error: saveError,
            message: saveError instanceof Error ? saveError.message : 'Unknown error',
            stack: saveError instanceof Error ? saveError.stack : undefined
          });

          // Show error toast to user
          showToast('Image generated but history save failed', 'error');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to generate image. Please try again.';
      const errorAssistantMessage = {
        ...generatingMessage,
        isGenerating: false,
        error: errorMessage,
        content: getLocalizedMessage(errorMessages, userLanguage),
      };

      setMessages(prev => prev.map(msg =>
        msg.id === generatingMessage.id ? errorAssistantMessage : msg
      ));

      // Save error message to database
      try {
        await apiClient.saveChatMessage({
          message_type: 'assistant',
          content: errorAssistantMessage.content,
          error_message: errorMessage,
          prompt: currentPrompt,
          generation_type: currentGenerationType,
          session_id: sessionId || undefined,
        });
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to start generating amazing AI images
            </p>
            <Link href="/login">
              <Button variant="yellow" fullWidth>
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredCredits = 4; // Fixed credit cost per generation
  const hasEnoughCredits = (user?.credits || 0) >= requiredCredits;
  const actualImageCount = uploadedImages.filter(img => img).length;

  if (authLoading || isLoadingHistory) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-black">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-60px)] relative bg-black">
        {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 left-6 z-50 bg-[#FFD700] hover:bg-[#DAA520] text-black p-3 rounded-full shadow-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isSidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          )}
        </svg>
      </button>

      {/* Left Sidebar - Hidden on desktop, mobile only */}
      <div className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:hidden fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-700 transition-transform duration-300 z-40 flex flex-col`}>

        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#FFD700]">
                AI Image Studio
              </h2>
              <p className="text-sm text-gray-400 mt-1">Create amazing images</p>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Tips:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Be specific and descriptive</li>
              <li>Use artistic styles like &quot;oil painting&quot; or &quot;digital art&quot;</li>
              <li>Include lighting details like &quot;golden hour&quot; or &quot;dramatic shadows&quot;</li>
              <li>Press Enter to generate</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-[220px] chat-scrollbar">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} message-animate`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.type === 'user'
                      ? 'bg-[#FFD700] text-black'
                      : message.error
                      ? 'bg-red-900/20 border border-red-800'
                      : 'bg-gray-800'
                  } rounded-2xl shadow-md px-4 py-3 transition-all duration-200`}
                >
                  {/* User Message */}
                  {message.type === 'user' && (
                    <div className="space-y-2">
                      <p className="font-medium">{message.prompt}</p>
                      {message.inputImages && message.inputImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.inputImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Input ${idx + 1}`}
                              className="w-16 h-16 rounded-lg object-cover border-2 border-primary/50"
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-90">
                          {message.generationType === 'image-to-image' ? 'Image to Image' : 'Text to Image'}
                        </p>
                        <button
                          onClick={() => {
                            setPrompt(message.prompt || '');
                            if (message.inputImages && message.inputImages.length > 0) {
                              setUploadedImages(message.inputImages.slice(0, 5));
                              setGenerationType('image-to-image');
                            } else {
                              setGenerationType('text-to-image');
                            }
                            // Scroll to input area
                            setTimeout(() => {
                              textareaRef.current?.focus();
                              textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }}
                          className="text-xs px-2 py-1 bg-black/20 hover:bg-black/30 rounded-lg transition-colors"
                        >
                          Edit Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Assistant Message */}
                  {message.type === 'assistant' && (
                    <div className="space-y-2">
                      {message.isGenerating ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-typing flex space-x-1">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                          </div>
                          <span className="text-sm text-gray-400 italic">
                            {getLocalizedMessage(processingMessages, userLanguage)}
                          </span>
                        </div>
                      ) : (
                        <>
                          {message.content && (
                            <p className={message.error ? 'text-red-400' : 'text-gray-200'}>
                              {message.content}
                            </p>
                          )}
                          {message.error && (
                            <p className="text-sm text-red-400">{message.error}</p>
                          )}
                          {message.imageUrl && (
                            <div className="space-y-3">
                              {/* Image container with overlay buttons */}
                              <div
                                className="relative group"
                                onMouseEnter={() => setHoveredImageId(message.id)}
                                onMouseLeave={() => setHoveredImageId(null)}
                              >
                                <img
                                  src={message.imageUrl}
                                  alt="Generated"
                                  className="rounded-lg max-w-full"
                                  onError={(e) => {
                                    console.error('Image failed to load:', message.imageUrl);
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280"%3EImage Loading Error%3C/text%3E%3C/svg%3E';
                                  }}
                                  loading="eager"
                                  crossOrigin="anonymous"
                                />

                                {/* Overlay buttons for download and share */}
                                <div
                                  className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-200 ${
                                    isMobile || hoveredImageId === message.id ? 'opacity-100' : 'opacity-0'
                                  }`}
                                >
                                  {/* Download button */}
                                  <button
                                    onClick={async () => {
                                      const result = await downloadImage(message.imageUrl!);
                                      if (result.success) {
                                        showToast({
                                          message: 'Image download started',
                                          type: 'success',
                                          duration: 2000
                                        });
                                      } else {
                                        showToast({
                                          message: result.error || 'Failed to download image',
                                          type: 'error',
                                          duration: 3000
                                        });
                                      }
                                    }}
                                    className="p-2.5 bg-black/60 hover:bg-black/80 text-[#FFD700] rounded-lg backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
                                    title="Download image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                                    </svg>
                                  </button>

                                  {/* Share button */}
                                  <button
                                    onClick={async () => {
                                      const result = await shareImage(message.imageUrl!, 'Check out my AI creation!');
                                      if (result.success) {
                                        if (result.method === 'clipboard' || result.method === 'clipboard-fallback') {
                                          showToast({
                                            message: 'Image URL copied to clipboard',
                                            type: 'success',
                                            duration: 2000
                                          });
                                        } else if (!result.cancelled) {
                                          showToast({
                                            message: 'Image shared successfully',
                                            type: 'success',
                                            duration: 2000
                                          });
                                        }
                                      } else if (!result.cancelled) {
                                        showToast({
                                          message: result.error || 'Failed to share image',
                                          type: 'error',
                                          duration: 3000
                                        });
                                      }
                                    }}
                                    className="p-2.5 bg-black/60 hover:bg-black/80 text-[#FFD700] rounded-lg backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
                                    title="Share image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  <Link href="/gallery">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      className="bg-[#FFD700] hover:bg-[#DAA520] text-black font-medium"
                                    >
                                      🎨 Gallery
                                    </Button>
                                  </Link>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      // For Gemini URLs, open directly
                                      // For others, try to download
                                      if (message.imageUrl?.includes('google.datas.systems')) {
                                        window.open(message.imageUrl, '_blank');
                                      } else {
                                        const link = document.createElement('a');
                                        link.href = message.imageUrl!;
                                        link.download = `generated-${Date.now()}.png`;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }
                                    }}
                                  >
                                    Full View
                                  </Button>
                                  {message.prompt && message.imageUrl && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleEditAgain(
                                        message.prompt!,
                                        message.imageUrl!
                                      )}
                                    >
                                      Continue Edit
                                    </Button>
                                  )}
                                </div>
                                {message.creditsUsed && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Used {message.creditsUsed} credits
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Timestamp - render only on client to avoid hydration mismatch */}
                  {typeof window !== 'undefined' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Bottom Controls - Compact and centered */}
        <div className="fixed bottom-0 left-0 lg:left-0 right-0 p-4 bg-gradient-to-t from-dark via-dark/95 to-transparent">
          <div className="max-w-2xl mx-auto">
            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 mb-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Credits Warning */}
            {!hasEnoughCredits && (
              <div className="bg-[#B8860B]/20 border border-primary/30 rounded-xl p-3 mb-2">
                <p className="text-primary text-sm text-center">
                  You need {requiredCredits} credits.
                  <Link href="/subscription" className="underline ml-1">Get more</Link>
                </p>
              </div>
            )}

            {/* Redesigned Input Area */}
            <div className="bg-dark-secondary rounded-2xl shadow-lg border border-gray-700">
              {/* Mode Toggle Buttons at Top */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  {/* Toggle Buttons for Mode Selection - Capsule shape */}
                  <div className="flex bg-dark-tertiary rounded-full p-0.5">
                    <button
                      onClick={() => {
                        setGenerationType('text-to-image');
                        setUploadedImages([]);
                      }}
                      className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                        generationType === 'text-to-image'
                          ? 'bg-primary text-black shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Text to Image
                    </button>
                    <button
                      onClick={() => setGenerationType('image-to-image')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                        generationType === 'image-to-image'
                          ? 'bg-primary text-black shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Image to Image
                    </button>
                  </div>
                </div>

                {/* Credits indicator */}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {requiredCredits} credits
                </span>
              </div>

              {/* Combined Textarea with Send Button Inside */}
              <div className="relative px-3 pt-3 pb-2">
                <div className="relative bg-gray-900 rounded-xl">
                  {/* Text Input */}
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      adjustTextareaHeight();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={generationType === 'image-to-image' ?
                      "Describe how to transform your image..." :
                      "Describe what you want to create..."}
                    className="w-full px-4 py-3 pr-14 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#FFD700] rounded-xl resize-none min-h-[80px] max-h-[150px] text-gray-100 placeholder-gray-500"
                    disabled={!hasEnoughCredits || isGenerating}
                    style={{ lineHeight: '1.6' }}
                  />

                  {/* Send Button Inside Textarea Container - Circular with Upward Arrow */}
                  <button
                    onClick={handleGenerate}
                    disabled={!hasEnoughCredits || isGenerating || !prompt.trim() ||
                      (generationType === 'image-to-image' && actualImageCount === 0)}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      (!hasEnoughCredits || isGenerating || !prompt.trim() ||
                        (generationType === 'image-to-image' && actualImageCount === 0))
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#FFD700] hover:bg-[#DAA520] text-black shadow-md hover:shadow-lg hover:scale-105'
                    }`}
                    title="Generate"
                  >
                    {isGenerating ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Uploaded Images and Upload Button - Only show in image-to-image mode */}
              {generationType === 'image-to-image' && (
                <div className="px-3 pb-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    {/* Uploaded Images - inline with button */}
                    {uploadedImages.filter(img => img).map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Upload ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-[#FFD700] transition-colors"
                        />
                        <button
                          onClick={() => {
                            const actualIndex = uploadedImages.indexOf(img);
                            removeUploadedImage(actualIndex);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-gray-200 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs font-bold shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {/* Upload Button - Now inline with images */}
                    {actualImageCount < 5 && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e)}
                          className="hidden"
                          id="image-upload-input"
                          multiple
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="image-upload-input"
                          className={`flex items-center justify-center gap-2 px-4 rounded-xl cursor-pointer transition-all whitespace-nowrap bg-gray-800 hover:bg-gray-700 text-gray-300 ${
                            isUploading ? 'opacity-50 cursor-wait' : ''
                          } ${
                            uploadedImages.filter(img => img).length > 0 ? 'h-16 w-16' : 'h-16 px-6'
                          }`}
                          title="Upload images (required for image-to-image)"
                        >
                          {isUploading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 4v16m8-8H4" />
                              </svg>
                              {uploadedImages.filter(img => img).length === 0 && (
                                <span className="text-sm font-medium">Add</span>
                              )}
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Upload progress and count indicator */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FFD700] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Compressing and uploading images... {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                  {!isUploading && uploadedImages.filter(img => img).length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {actualImageCount} of 5 images uploaded
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
        </div>
      </div>
      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  );
}