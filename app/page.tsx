'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import DefaultLayout from "@/components/layout/DefaultLayout";
import {
  MessageSquare,
  MousePointer2,
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  Zap,
  Target,
  Palette,
  ShoppingBag,
  User,
  Image as ImageIcon,
  Brush
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activeDemo, setActiveDemo] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Auto-rotate demo examples
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoExamples.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const demoExamples = [
    {
      command: '"Change the background to a sunset beach"',
      before: '/api/placeholder/400/300',
      after: '/api/placeholder/400/300',
      description: 'Natural language background replacement'
    },
    {
      command: '"Make the dress red instead of blue"',
      before: '/api/placeholder/400/300',
      after: '/api/placeholder/400/300',
      description: 'Precise color changes with object consistency'
    },
    {
      command: '"Remove the person in the background"',
      before: '/api/placeholder/400/300',
      after: '/api/placeholder/400/300',
      description: 'Smart object removal with AI fill'
    }
  ];

  const coreFeatures = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "对话精准P图",
      subtitle: "Conversational Editing",
      description: "Edit images through natural conversations. Just describe what you want to change in plain language.",
      benefits: ["No complex tools to learn", "Instant understanding", "Multiple edits in one conversation"],
      animation: "animate-pulse"
    },
    {
      icon: <MousePointer2 className="w-8 h-8" />,
      title: "指哪改哪",
      subtitle: "Point-and-Edit Precision",
      description: "Click on any part of your image and describe the change. Our AI understands exactly what you mean.",
      benefits: ["Pixel-perfect accuracy", "No manual masking", "Intuitive selection"],
      animation: "animate-bounce"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "保持物体一致性",
      subtitle: "Object Consistency",
      description: "Advanced AI maintains the integrity of your subjects while making edits. No distortion, no artifacts.",
      benefits: ["Preserves original quality", "Natural-looking results", "Professional output"],
      animation: "animate-spin-slow"
    }
  ];

  const useCases = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "E-commerce Products",
      description: "Change product colors, backgrounds, and styles instantly",
      example: '"Make this shoe available in blue"',
      industries: ["Fashion", "Furniture", "Electronics"]
    },
    {
      icon: <User className="w-6 h-6" />,
      title: "Portrait Retouching",
      description: "Natural beauty edits with conversational commands",
      example: '"Brighten the smile and smooth the skin"',
      industries: ["Photography", "Social Media", "Dating Apps"]
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: "Background Replacement",
      description: "Transport subjects to any location or setting",
      example: '"Put this person in a professional office"',
      industries: ["Real Estate", "Travel", "Marketing"]
    },
    {
      icon: <Brush className="w-6 h-6" />,
      title: "Style Transfer",
      description: "Apply artistic styles while preserving structure",
      example: '"Make it look like a watercolor painting"',
      industries: ["Art", "Design", "Content Creation"]
    }
  ];

  const comparisonData = [
    {
      traditional: "Learn complex selection tools",
      nanobanana: "Just describe what to select",
      icon: <Target className="w-5 h-5" />
    },
    {
      traditional: "Manual masking and layers",
      nanobanana: "AI understands object boundaries",
      icon: <MousePointer2 className="w-5 h-5" />
    },
    {
      traditional: "Multiple steps for one edit",
      nanobanana: "One conversation, multiple edits",
      icon: <Zap className="w-5 h-5" />
    },
    {
      traditional: "Risk of quality loss",
      nanobanana: "Maintains original quality",
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      traditional: "Hours of learning curve",
      nanobanana: "Start editing immediately",
      icon: <Palette className="w-5 h-5" />
    }
  ];

  const faqs = [
    {
      question: "What is conversational image editing?",
      answer: "Conversational image editing allows you to modify images using natural language commands. Instead of using complex tools and menus, you simply describe what changes you want to make, and our AI understands and executes your vision. It's like having a professional photo editor who understands plain English."
    },
    {
      question: "How does natural language photo editing work?",
      answer: "Our advanced AI model processes your text commands and understands the context of your image. When you say 'make the sky more dramatic' or 'change her dress to red', the AI identifies the relevant objects, maintains their consistency, and applies the changes naturally. It combines computer vision with language understanding for precise edits."
    },
    {
      question: "What makes NanoBanana different from other editors?",
      answer: "NanoBanana stands out with three key innovations: 1) True conversational editing where you can have a back-and-forth dialogue about changes, 2) Point-and-edit precision that lets you click exactly where you want changes, and 3) Advanced object consistency that maintains the integrity of your subjects while editing. No other tool combines these capabilities with such ease of use."
    },
    {
      question: "Can I make multiple edits in one session?",
      answer: "Absolutely! You can chain multiple edits in a single conversation. For example, you can say 'Change the background to a beach, make her dress blue, remove the person on the left, and add a sunset glow.' Our AI will process all these changes while maintaining consistency throughout."
    },
    {
      question: "Is my data and images secure?",
      answer: "Yes, we take security seriously. All images are processed with enterprise-grade encryption, and we never store your personal images without explicit permission. Your creative work remains yours, and we have strict privacy policies in place to protect your data."
    },
    {
      question: "What image formats are supported?",
      answer: "NanoBanana supports all major image formats including JPEG, PNG, WebP, and HEIC. We also support high-resolution images up to 4K, ensuring your edits maintain professional quality."
    }
  ];

  return (
    <DefaultLayout>
      <div className="relative overflow-hidden">
        {/* Enhanced Hero Section with Animation */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-b from-black via-gray-900 to-black">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-96 h-96 -top-48 -left-48 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative container mx-auto px-4 py-20">
            <div className="text-center max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-500 font-medium">AI-Powered Precision Editing</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent leading-tight">
                Conversational AI Image Editor
                <span className="block text-3xl md:text-5xl mt-2 text-white">
                  Point, Describe, Perfect
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto">
                Edit images with natural language. Maintain perfect object consistency.
                Transform your photos through simple conversations - no complex tools needed.
              </p>

              {/* Interactive Command Preview */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-10 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">Live AI Editor</span>
                </div>
                <div className="font-mono text-left text-yellow-500">
                  <span className="text-gray-500">You:</span> {demoExamples[activeDemo].command}
                  <span className="inline-block w-2 h-5 bg-yellow-500 ml-1 animate-blink"></span>
                </div>
                <div className="text-left mt-2 text-sm text-gray-400">
                  <span className="text-gray-500">AI:</span> {demoExamples[activeDemo].description}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={isAuthenticated ? "/generate" : "/login"}>
                  <Button size="lg" className="min-w-[200px] bg-yellow-500 text-black hover:bg-yellow-400 font-semibold transition-all transform hover:scale-105">
                    Try Free Demo
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="secondary" size="lg" className="min-w-[200px] border-gray-700 hover:border-yellow-500 transition-all">
                    See How It Works
                    <ChevronDown className="ml-2 w-5 h-5 animate-bounce" />
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>5 Free Edits Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section id="demo" className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-500">
                See The Magic In Action
              </h2>
              <p className="text-xl text-gray-400">
                Watch how natural language transforms your images instantly
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              {/* Demo Tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {demoExamples.map((demo, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveDemo(index)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeDemo === index
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    Example {index + 1}
                  </button>
                ))}
              </div>

              {/* Before/After Slider */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ height: '500px' }}>
                <div className="absolute inset-0 flex">
                  {/* Before Image */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-20 h-20 text-gray-600 mb-4 mx-auto" />
                      <p className="text-gray-500 font-medium">Original Image</p>
                    </div>
                  </div>

                  {/* After Image */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 flex items-center justify-center"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <div className="text-center">
                      <Sparkles className="w-20 h-20 text-yellow-500 mb-4 mx-auto" />
                      <p className="text-yellow-500 font-medium">AI Edited</p>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-yellow-500 cursor-ew-resize"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Slider Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize"
                />

                {/* Demo Command Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-yellow-500 font-mono mb-2">{demoExamples[activeDemo].command}</p>
                    <p className="text-gray-400 text-sm">{demoExamples[activeDemo].description}</p>
                  </div>
                </div>
              </div>

              {/* Try It Yourself */}
              <div className="mt-8 text-center">
                <p className="text-gray-400 mb-4">Ready to try it yourself?</p>
                <Link href={isAuthenticated ? "/generate" : "/login"}>
                  <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-500">
                Revolutionary Features
              </h2>
              <p className="text-xl text-gray-400">
                Three breakthrough technologies that redefine image editing
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {coreFeatures.map((feature, index) => (
                <div key={index} className="group">
                  <Card className="h-full bg-black border-gray-800 hover:border-yellow-500/50 transition-all duration-300 transform hover:-translate-y-2">
                    <CardContent className="p-8">
                      <div className={`inline-flex p-3 bg-yellow-500/10 rounded-xl mb-6 ${feature.animation}`}>
                        <div className="text-yellow-500">{feature.icon}</div>
                      </div>

                      <h3 className="text-2xl font-bold mb-2 text-yellow-500">
                        {feature.title}
                      </h3>
                      <p className="text-lg text-gray-300 mb-4">
                        {feature.subtitle}
                      </p>
                      <p className="text-gray-400 mb-6">
                        {feature.description}
                      </p>

                      <ul className="space-y-3">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-400">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Gallery */}
        <section className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-500">
                Endless Possibilities
              </h2>
              <p className="text-xl text-gray-400">
                Professional results for every industry and use case
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {useCases.map((useCase, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-yellow-500/50 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                        <div className="text-yellow-500">{useCase.icon}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-white">
                          {useCase.title}
                        </h3>
                        <p className="text-gray-400 mb-3">
                          {useCase.description}
                        </p>
                        <div className="bg-black/50 rounded-lg p-3 mb-3">
                          <code className="text-sm text-yellow-500">{useCase.example}</code>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {useCase.industries.map((industry, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                              {industry}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-500">
                Why Choose NanoBanana?
              </h2>
              <p className="text-xl text-gray-400">
                See how we compare to traditional image editors
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-900/50 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 bg-gray-800/50">
                  <div className="p-4 text-center border-r border-gray-700">
                    <h3 className="font-semibold text-gray-400">Traditional Editors</h3>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-yellow-500">NanoBanana</h3>
                  </div>
                </div>

                {comparisonData.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 border-t border-gray-800">
                    <div className="p-6 border-r border-gray-800 flex items-center gap-3">
                      <div className="text-red-500/50">{item.icon}</div>
                      <span className="text-gray-500 line-through">{item.traditional}</span>
                    </div>
                    <div className="p-6 flex items-center gap-3 bg-yellow-500/5">
                      <div className="text-yellow-500">{item.icon}</div>
                      <span className="text-gray-300 font-medium">{item.nanobanana}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-3">
                  <Zap className="w-5 h-5 text-green-500" />
                  <span className="text-green-500 font-medium">
                    10x Faster Than Traditional Editing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-500">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-400">
                Everything you need to know about conversational image editing
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="mb-4">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full text-left p-6 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all border border-gray-800 hover:border-yellow-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white pr-4">
                        {faq.question}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-yellow-500 transition-transform ${
                          expandedFaq === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {expandedFaq === index && (
                      <div className="mt-4 text-gray-400 leading-relaxed animate-fadeIn">
                        {faq.answer}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 bg-gradient-to-r from-yellow-600 to-yellow-500">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
                Start Your AI Editing Journey Today
              </h2>
              <p className="text-xl mb-10 text-black/80">
                Join thousands of creators who&apos;ve discovered the power of conversational image editing
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href={isAuthenticated ? "/generate" : "/login"}>
                  <Button size="lg" className="min-w-[200px] bg-black text-yellow-500 hover:bg-gray-900 border-2 border-black font-semibold">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button size="lg" variant="secondary" className="min-w-[200px] bg-transparent text-black border-2 border-black hover:bg-black/10">
                    View Gallery
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-black/70">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>5 Free Edits Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DefaultLayout>
  );
}