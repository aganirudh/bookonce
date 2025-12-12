import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  Camera, 
  MapPin, 
  Shield, 
  AlertTriangle,
  Send,
  Upload,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface CommunityReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: {
    name: string;
    coordinates: [number, number];
    address?: string;
  };
  type: 'place' | 'safety';
}

export const CommunityReviewModal = ({ isOpen, onClose, location, type }: CommunityReviewModalProps) => {
  const [reviewType, setReviewType] = useState<'place' | 'safety'>(type);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 3)); // Max 3 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (reviewType === 'place') {
        console.log('Place review submitted:', {
          location,
          rating,
          title,
          description,
          photos: photos.length,
          anonymous
        });
      } else {
        console.log('Safety report submitted:', {
          location,
          category,
          severity,
          title,
          description,
          anonymous
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setTitle('');
    setDescription('');
    setCategory('');
    setSeverity('low');
    setAnonymous(false);
    setPhotos([]);
    setSubmitted(false);
  };

  const isValid = reviewType === 'place' 
    ? rating > 0 && title.trim() && description.trim()
    : category && title.trim() && description.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="modal-container"
          >
            <div className="modal-content review-modal">
              <div className="bg-card rounded-2xl shadow-2xl border border-border">
              {submitted ? (
                // Success State
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Send className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {reviewType === 'place' ? 'Review Submitted!' : 'Safety Report Submitted!'}
                  </h3>
                  <p className="text-muted-foreground">
                    Thank you for contributing to our community. Your {reviewType === 'place' ? 'review' : 'report'} helps keep everyone informed and safe.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${reviewType === 'place' ? 'bg-blue-500' : 'bg-orange-500'} flex items-center justify-center`}>
                          {reviewType === 'place' ? (
                            <Star className="w-5 h-5 text-white" />
                          ) : (
                            <Shield className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-foreground">
                            {reviewType === 'place' ? 'Write a Review' : 'Report Safety Concern'}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Help others with your experience
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Location Info */}
                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{location.name}</div>
                        {location.address && (
                          <div className="text-xs text-muted-foreground">{location.address}</div>
                        )}
                      </div>
                    </div>

                    {/* Review Type Toggle */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant={reviewType === 'place' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewType('place')}
                        className="flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Place Review
                      </Button>
                      <Button
                        variant={reviewType === 'safety' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewType('safety')}
                        className="flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Safety Report
                      </Button>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {reviewType === 'place' ? (
                      <>
                        {/* Rating */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Rating *</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 transition-colors"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= (hoverRating || rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Safety Category */}
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Report Category *</Label>
                          <RadioGroup value={category} onValueChange={setCategory}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="crime" id="crime" />
                              <Label htmlFor="crime">Crime or Suspicious Activity</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="harassment" id="harassment" />
                              <Label htmlFor="harassment">Harassment or Intimidation</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="infrastructure" id="infrastructure" />
                              <Label htmlFor="infrastructure">Poor Lighting or Infrastructure</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="scam" id="scam" />
                              <Label htmlFor="scam">Scam or Fraud</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other">Other Safety Concern</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Severity */}
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Severity Level</Label>
                          <RadioGroup value={severity} onValueChange={(value) => setSeverity(value as 'low' | 'medium' | 'high')}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="low" id="low" />
                              <Label htmlFor="low" className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Low - Minor concern or general awareness
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="medium" id="medium" />
                              <Label htmlFor="medium" className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                Medium - Moderate concern, exercise caution
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="high" id="high" />
                              <Label htmlFor="high" className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                High - Serious concern, avoid if possible
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </>
                    )}

                    {/* Title */}
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                        Title *
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={reviewType === 'place' ? 'Summarize your experience...' : 'Brief description of the concern...'}
                        className="w-full"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={reviewType === 'place' 
                          ? 'Share details about your experience, what you liked or didn\'t like...'
                          : 'Provide details about the safety concern, when it occurred, and any relevant context...'
                        }
                        className="w-full min-h-[100px]"
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Photos (Optional)
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            className="flex items-center gap-2"
                            disabled={photos.length >= 3}
                          >
                            <Camera className="w-4 h-4" />
                            Add Photos ({photos.length}/3)
                          </Button>
                        </div>
                        
                        {photos.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {photos.map((photo, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(photo)}
                                  alt={`Upload ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Anonymous Option */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anonymous"
                        checked={anonymous}
                        onCheckedChange={(checked) => setAnonymous(checked as boolean)}
                      />
                      <Label htmlFor="anonymous" className="text-sm">
                        Submit anonymously
                      </Label>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="flex-1 flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit {reviewType === 'place' ? 'Review' : 'Report'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};