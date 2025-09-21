'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading, Skeleton } from '@/components/ui/Loading';
import { Error } from '@/components/ui/Error';
import { apiClient } from '@/lib/api/client';
import type { ImageGeneration } from '@/lib/types/database';
import Link from 'next/link';
import DefaultLayout from '@/components/layout/DefaultLayout';

export default function GalleryPage() {
  const { isAuthenticated } = useAuth();
  const [generations, setGenerations] = useState<ImageGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageGeneration | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const itemsPerPage = 12;

  const fetchGenerations = useCallback(async (pageNum: number, statusFilter?: string) => {
    if (!isAuthenticated) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await apiClient.getGenerations({
        limit: itemsPerPage,
        offset: pageNum * itemsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter as any,
      });

      if (pageNum === 0) {
        setGenerations(response.generations);
      } else {
        setGenerations(prev => [...prev, ...response.generations]);
      }

      setTotalCount(response.total);
      setHasMore((pageNum + 1) * itemsPerPage < response.total);
    } catch (err) {
      console.error('Failed to fetch generations:', err);
      setError('Failed to load your gallery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setPage(0);
    setGenerations([]);
    setIsLoading(true);
    fetchGenerations(0, filter === 'all' ? undefined : filter);
  }, [filter, fetchGenerations]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGenerations(nextPage, filter === 'all' ? undefined : filter);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await apiClient.deleteGeneration(id);
      setGenerations(prev => prev.filter(g => g.id !== id));
      setTotalCount(prev => prev - 1);
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Failed to delete generation:', err);
      alert('Failed to delete image. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return badges[status as keyof typeof badges] || '';
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <div className="mb-6">
              <span className="text-5xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Sign In to View Gallery</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign in to view and manage your generated images
            </p>
            <Link href="/login">
              <Button variant="primary" fullWidth>
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#FFD700] to-[#DAA520] bg-clip-text text-transparent">
            Your Gallery
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {totalCount > 0 ? `${totalCount} creations` : 'Your AI-generated masterpieces'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            {(['all', 'completed', 'processing', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md transition-all capitalize ${
                  filter === status
                    ? 'bg-[#FFD700] text-black font-medium'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Error
            message={error}
            onRetry={() => {
              setError(null);
              setIsLoading(true);
              fetchGenerations(0, filter === 'all' ? undefined : filter);
            }}
          />
        )}

        {/* Loading State */}
        {isLoading && generations.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-64" variant="rectangular" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {!isLoading && generations.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <span className="text-6xl mb-4 block">🎨</span>
              <h3 className="text-2xl font-semibold mb-2">No Images Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start creating amazing AI-generated images
              </p>
              <Link href="/generate">
                <Button variant="primary">
                  Generate Your First Image
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {generations.map((generation) => (
                <Card
                  key={generation.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => setSelectedImage(generation)}
                >
                  <div className="relative aspect-square bg-gray-800">
                    {generation.output_image_url ? (
                      <img
                        src={generation.output_image_url}
                        alt={generation.prompt}
                        className="w-full h-full object-cover"
                      />
                    ) : generation.status === 'processing' ? (
                      <div className="flex items-center justify-center h-full">
                        <Loading size="lg" text="Processing..." />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-4xl">❌</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-gray-300">
                        <p className="text-sm line-clamp-2">{generation.prompt}</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(generation.status)}`}>
                        {generation.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {generation.generation_type === 'image-to-image' ? '🖼️→🖼️' : '✏️→🖼️'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !isLoading && (
              <div className="text-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  variant="secondary"
                  size="lg"
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedImage.output_image_url && (
                <img
                  src={selectedImage.output_image_url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Image Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Prompt:</strong> {selectedImage.prompt}</p>
                  <p><strong>Type:</strong> {selectedImage.generation_type}</p>
                  <p><strong>Credits Used:</strong> {selectedImage.credits_used}</p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full ${getStatusBadge(selectedImage.status)}`}>{selectedImage.status}</span></p>
                  <p><strong>Created:</strong> {new Date(selectedImage.created_at).toLocaleString()}</p>
                </div>
                <div className="flex space-x-3 mt-6">
                  {selectedImage.output_image_url && (
                    <Button
                      onClick={() => window.open(selectedImage.output_image_url!, '_blank')}
                      variant="primary"
                    >
                      Download
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(selectedImage.id)}
                    variant="danger"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => setSelectedImage(null)}
                    variant="ghost"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </DefaultLayout>
  );
}