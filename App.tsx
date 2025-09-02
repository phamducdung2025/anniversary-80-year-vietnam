/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef } from 'react';
import { generateCelebrationImage } from './services/geminiService';
import Footer from './components/Footer';

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "font-sriracha text-xl w-full text-center text-black bg-yellow-400 py-3 px-6 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-yellow-300 shadow-lg";
const secondaryButtonClasses = "font-sriracha text-xl w-full text-center text-yellow-400 bg-transparent border-2 border-yellow-400 py-3 px-6 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-yellow-400 hover:text-black";

const UploadPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-yellow-200/50 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-sriracha text-lg text-center">Tải ảnh của bạn lên</span>
    </div>
);

const ResultPlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-md p-8">
       <div className="text-center text-neutral-300 opacity-50">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
         <p className="font-sriracha text-xl">Ảnh kỷ niệm của bạn sẽ xuất hiện ở đây</p>
       </div>
    </div>
);

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full text-white">
        <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 font-sriracha text-lg animate-pulse">Đang tạo ảnh, vui lòng chờ...</p>
    </div>
);

const ErrorDisplay = ({ error }: { error?: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-red-300 p-4">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4 font-sriracha text-lg text-center">Rất tiếc, đã có lỗi xảy ra.</p>
        <p className="text-sm text-center mt-2 text-red-200">{error}</p>
    </div>
);


function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [outfitDescription, setOutfitDescription] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setGeneratedImage(null); // Clear previous result on new upload
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) {
            alert("Vui lòng tải ảnh của bạn lên trước.");
            return;
        };

        setIsLoading(true);
        setGeneratedImage(null);
        
        try {
            const resultUrl = await generateCelebrationImage(uploadedImage, outfitDescription);
            setGeneratedImage({ status: 'done', url: resultUrl });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImage({ status: 'error', error: errorMessage });
            console.error(`Failed to generate image:`, err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImage(null);
        setOutfitDescription('');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDownloadImage = () => {
        if (generatedImage?.status === 'done' && generatedImage.url) {
            const link = document.createElement('a');
            link.href = generatedImage.url;
            link.download = `anh-ky-niem-quoc-khanh.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <main className="bg-red-800 text-yellow-50 min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8 pb-24 overflow-auto">
            <div className="w-full max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-lobster font-bold text-yellow-300 drop-shadow-lg">Kỷ niệm 80 năm Quốc Khánh Việt Nam</h1>
                    <p className="font-sriracha text-neutral-100 mt-2 text-xl tracking-wide">(2/9/1945 - 2/9/2025)</p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8 w-full">
                    {/* Left Panel: Controls */}
                    <div className="w-full lg:w-[400px] bg-red-700/80 p-6 rounded-lg shadow-2xl border border-yellow-400/20 space-y-6 flex-shrink-0">
                        <div>
                            <label className="block text-lg font-sriracha text-yellow-300 mb-2">1. Tải ảnh của bạn lên</label>
                            <label htmlFor="file-upload" className="cursor-pointer group block w-full aspect-square bg-black/20 rounded-md border-2 border-dashed border-yellow-400/50 hover:border-yellow-400 transition-colors duration-300 relative">
                                {uploadedImage ? (
                                    <img src={uploadedImage} alt="Uploaded preview" className="w-full h-full object-cover rounded-md" />
                                ) : (
                                    <UploadPlaceholder />
                                )}
                            </label>
                            <input id="file-upload" ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                        </div>

                        <div>
                            <label htmlFor="outfit-desc" className="block text-lg font-sriracha text-yellow-300 mb-2">2. Mô tả nghề nghiệp hoặc trang phục</label>
                            <textarea
                                id="outfit-desc"
                                value={outfitDescription}
                                onChange={(e) => setOutfitDescription(e.target.value)}
                                placeholder="VD: Giáo viên, bác sĩ, công an,... hoặc chi tiết hơn như bộ quân phục màu xanh, áo dài đỏ với sao vàng, trang phục dân tộc..."
                                className="w-full h-28 p-3 bg-red-900/50 border-2 border-yellow-400/50 rounded-md text-neutral-100 placeholder:text-yellow-100/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <button onClick={handleGenerateClick} disabled={isLoading || !uploadedImage} className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {isLoading ? 'Đang tạo...' : 'Tạo ảnh'}
                            </button>
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Làm lại
                            </button>
                        </div>

                        <p className="text-center font-sriracha text-sm text-yellow-300/50 pt-4">
                            ZALO: DŨNG PHẠM
                        </p>
                    </div>

                    {/* Right Panel: Result */}
                    <div className="w-full flex-1 min-h-[400px] lg:min-h-0 flex flex-col items-center justify-center bg-red-700/50 p-4 rounded-lg shadow-2xl">
                         <div className="w-full max-w-2xl aspect-[4/5] p-4 bg-white rounded-md shadow-inner">
                            <div className="w-full h-full bg-neutral-200 flex items-center justify-center rounded-sm relative">
                                {isLoading && <LoadingSpinner />}
                                {!isLoading && generatedImage?.status === 'error' && <ErrorDisplay error={generatedImage.error} />}
                                {!isLoading && generatedImage?.status === 'done' && generatedImage.url && (
                                    <>
                                        <img src={generatedImage.url} alt="Generated commemorative photo" className="w-full h-full object-contain" />
                                        <button 
                                            onClick={handleDownloadImage}
                                            className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                                            aria-label="Download image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                                {!isLoading && !generatedImage && <ResultPlaceholder />}
                            </div>
                         </div>
                        <p className="font-sriracha text-xl mt-4 text-neutral-800 bg-white py-1 px-4 rounded-sm">
                            Your Commemorative Photo
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}

export default App;
