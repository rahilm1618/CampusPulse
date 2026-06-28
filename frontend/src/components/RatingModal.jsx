import { useState } from 'react';
import axios from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { FaStar, FaTimes, FaRedo } from 'react-icons/fa';

const RatingModal = ({ incident, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            return toast.error("Please select a rating (1-5 stars)");
        }

        try {
            setIsSubmitting(true);
            await axios.patch(`/incidents/${incident._id}/rate`, {
                rating,
                feedback
            });
            
            if (rating < 2) {
                toast.warning(`Task Reopened! The staff has been notified.`);
            } else {
                toast.success(`Thank you for rating! Task officially closed.`);
            }
            
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit rating");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in-up">
            <div className="bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-gray-700">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes size={20} />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Rate Resolution</h2>
                    <p className="text-gray-400 text-sm">
                        How satisfied are you with the resolution of <strong className="text-white">{incident.title}</strong>?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Interactive Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[...Array(5)].map((_, index) => {
                            const starValue = index + 1;
                            return (
                                <button
                                    type="button"
                                    key={starValue}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onClick={() => setRating(starValue)}
                                    onMouseEnter={() => setHover(starValue)}
                                    onMouseLeave={() => setHover(rating)}
                                >
                                    <FaStar
                                        size={40}
                                        className={`transition-colors ${
                                            starValue <= (hover || rating)
                                                ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                                                : 'text-gray-600'
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Rating Helper Text */}
                    <div className="text-center h-4">
                        {rating === 1 && <p className="text-red-400 text-sm font-bold flex items-center justify-center gap-1"><FaRedo size={12}/> Poor (This will reopen the task)</p>}
                        {rating === 2 && <p className="text-orange-400 text-sm font-bold">Fair</p>}
                        {rating === 3 && <p className="text-yellow-400 text-sm font-bold">Good</p>}
                        {rating === 4 && <p className="text-blue-400 text-sm font-bold">Very Good</p>}
                        {rating === 5 && <p className="text-green-400 text-sm font-bold">Excellent!</p>}
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Additional Feedback <span className="text-gray-500 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us more about your experience..."
                            rows="3"
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || rating === 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                            rating === 1 
                            ? 'bg-linear-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-red-500/25 text-white' 
                            : 'bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-blue-500/25 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? 'Submitting...' : (rating === 1 ? 'Reopen Task' : 'Submit Rating')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
