import DirectImage from './DirectImage';

interface ImageModalProps {
  imagePath: string;
  date: string;
  onClose: () => void;
}

export default function ImageModal({ imagePath, date, onClose }: ImageModalProps) {
  // Log the URL for debugging
  console.log('Modal image URL:', imagePath);
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div className="relative max-w-7xl w-full max-h-[90vh] animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl cursor-pointer transition-colors duration-200"
        >
          ✕
        </button>
        <div className="relative w-full h-[80vh]">
          <DirectImage
            src={imagePath}
            alt={`Screenshot from ${new Date(date).toLocaleString()}`}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm p-2 text-center">
          {new Date(date).toLocaleString()}
        </div>
      </div>
    </div>
  );
} 