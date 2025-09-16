import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, StopCircle, Play, AlertTriangle, Eye, EyeOff, Phone, Book, Users, Clock, Download, Shield } from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VideoProctoringSystem = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [detections, setDetections] = useState([]);
  const [currentDetection, setCurrentDetection] = useState('');
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    interviewStarted: false,
    interviewId: null
  });
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [focusLostCount, setFocusLostCount] = useState(0);
  const [suspiciousEvents, setSuspiciousEvents] = useState(0);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [aiModelsLoaded, setAiModelsLoaded] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  // AI Detection states
  const [detectionStatus, setDetectionStatus] = useState({
    faceDetected: false,
    lookingAtScreen: true,
    multipleFaces: false,
    phoneDetected: false,
    notesDetected: false,
    deviceDetected: false,
    lastFaceTime: Date.now(),
    lastFocusTime: Date.now()
  });

  // not able to implement
/*
import aiDetectionSystem from './aiDetection';

// In your component
useEffect(() => {
  const initAI = async () => {
    const success = await aiDetectionSystem.initialize();
    if (success) {
      setAiModelsLoaded(true);
    }
  };
  
  initAI();
  
  return () => {
    aiDetectionSystem.dispose();
  };
}, []);

// detection loop
const performAIDetection = useCallback(async () => {
  if (!videoRef.current || !aiDetectionSystem.isReady()) return;

  const results = await aiDetectionSystem.performCompleteDetection(videoRef.current);
  
  if (results) {
    setDetectionStatus(prev => ({
      ...prev,
      faceDetected: results.faceDetected,
      multipleFaces: results.multipleFaces,
      lookingAtScreen: results.lookingAtScreen,
      phoneDetected: results.phoneDetected,
      notesDetected: results.notesDetected,
      deviceDetected: results.deviceDetected
    }));
  }
}, []);
*/

  // TensorFlow.js models (these would be loaded from CDN in production)
  const [models, setModels] = useState({
    faceDetection: null,
    objectDetection: null,
    poseEstimation: null
  });

  // Load AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, you would load actual TensorFlow.js models
        // For now, we'll simulate model loading
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setModels({
          faceDetection: { loaded: true }, // Simulated model
          objectDetection: { loaded: true }, // Simulated model
          poseEstimation: { loaded: true } // Simulated model
        });
        
        setAiModelsLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading AI models:', error);
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Interview timer
  useEffect(() => {
    if (candidateInfo.interviewStarted && isRecording) {
      intervalRef.current = setInterval(() => {
        setInterviewDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [candidateInfo.interviewStarted, isRecording]);

  // AI Detection loop
  useEffect(() => {
    if (candidateInfo.interviewStarted && isRecording && aiModelsLoaded) {
      detectionIntervalRef.current = setInterval(() => {
        performAIDetection();
      }, 1000); // Run detection every second
    } else {
      clearInterval(detectionIntervalRef.current);
    }

    return () => clearInterval(detectionIntervalRef.current);
  }, [candidateInfo.interviewStarted, isRecording, aiModelsLoaded]);

  // AI Detection function (simulated for demo - replace with real AI)
  const performAIDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0);

    try {
      // Simulate AI detection results (replace with real TensorFlow.js inference)
      const detectionResults = await simulateAIDetection();
      
      // Update detection status
      setDetectionStatus(prev => ({
        ...prev,
        ...detectionResults,
        lastFaceTime: detectionResults.faceDetected ? Date.now() : prev.lastFaceTime,
        lastFocusTime: detectionResults.lookingAtScreen ? Date.now() : prev.lastFocusTime
      }));

      // Check for violations
      await checkViolations(detectionResults);

    } catch (error) {
      console.error('Detection error:', error);
    }
  }, [candidateInfo.interviewId, interviewDuration]);

  // Simulate AI detection (replace with real TensorFlow.js models)
  const simulateAIDetection = async () => {
    // Simulate face detection
    const faceDetected = Math.random() > 0.1; // 90% chance of face detected
    const multipleFaces = faceDetected ? Math.random() < 0.05 : false; // 5% chance of multiple faces
    const lookingAtScreen = faceDetected ? Math.random() > 0.15 : false; // 85% looking at screen when face detected
    
    // Simulate object detection
    const phoneDetected = Math.random() < 0.01; // 1% chance
    const notesDetected = Math.random() < 0.02; // 2% chance
    const deviceDetected = Math.random() < 0.005; // 0.5% chance

    return {
      faceDetected,
      multipleFaces,
      lookingAtScreen,
      phoneDetected,
      notesDetected,
      deviceDetected
    };
  };

  // Check for violations and log them
  const checkViolations = async (results) => {
    const currentTime = Date.now();
    
    // No face detected for >10 seconds
    if (!results.faceDetected && (currentTime - detectionStatus.lastFaceTime) > 10000) {
      await logDetection('no_face', 'No face detected in frame for over 10 seconds', 'error', 0.9);
    }
    
    // Not looking at screen for >5 seconds
    if (!results.lookingAtScreen && (currentTime - detectionStatus.lastFocusTime) > 5000) {
      await logDetection('focus_lost', 'Candidate not looking at screen for over 5 seconds', 'warning', 0.8);
    }
    
    // Multiple faces detected
    if (results.multipleFaces) {
      await logDetection('multiple_faces', 'Multiple faces detected in frame', 'error', 0.95);
    }
    
    // Phone detected
    if (results.phoneDetected) {
      await logDetection('phone', 'Mobile phone detected in frame', 'error', 0.85);
    }
    
    // Notes/books detected
    if (results.notesDetected) {
      await logDetection('notes', 'Books or notes detected in frame', 'warning', 0.75);
    }
    
    // Unauthorized device detected
    if (results.deviceDetected) {
      await logDetection('device', 'Unauthorized electronic device detected', 'error', 0.88);
    }
  };

  // Log detection to backend
  const logDetection = async (type, message, severity, confidence) => {
    const detection = {
      interviewId: candidateInfo.interviewId,
      type,
      message,
      severity,
      timeInInterview: interviewDuration,
      confidence,
      metadata: {
        timestamp: new Date().toISOString(),
        detectionStatus: detectionStatus
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/detections/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detection),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setDetections(prev => [...prev, result.detection]);
        setCurrentDetection(message);
        
        // Update statistics
        if (type === 'focus_lost') {
          setFocusLostCount(prev => prev + 1);
        }
        if (severity === 'error') {
          setSuspiciousEvents(prev => prev + 1);
        }
        
        // Update integrity score
        const deduction = severity === 'error' ? 5 : 2;
        setIntegrityScore(prev => Math.max(0, prev - deduction));
        
        // Clear current detection after 3 seconds
        setTimeout(() => setCurrentDetection(''), 3000);
      }
    } catch (error) {
      console.error('Error logging detection:', error);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup MediaRecorder for recording
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await uploadVideo(blob);
      };

    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  // Upload video to backend
  const uploadVideo = async (videoBlob) => {
    if (!candidateInfo.interviewId) return;

    const formData = new FormData();
    formData.append('video', videoBlob, `interview-${candidateInfo.interviewId}.webm`);

    try {
      const response = await fetch(`${API_BASE_URL}/videos/upload/${candidateInfo.interviewId}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Video uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  // Start interview
  const startInterview = async () => {
    if (!candidateInfo.name || !candidateInfo.email) {
      alert('Please enter candidate details before starting the interview.');
      return;
    }
    
    if (!aiModelsLoaded) {
      alert('AI models are still loading. Please wait...');
      return;
    }

    setIsLoading(true);

    try {
      // Create interview in backend
      const response = await fetch(`${API_BASE_URL}/interviews/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: candidateInfo.name,
          candidateEmail: candidateInfo.email
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCandidateInfo(prev => ({ 
          ...prev, 
          interviewStarted: true,
          interviewId: result.interview._id
        }));
        
        await startRecording();
      } else {
        throw new Error('Failed to start interview');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    await startCamera();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  // Stop recording and end interview
  const stopRecording = async () => {
    setIsLoading(true);

    try {
      // End interview in backend
      await fetch(`${API_BASE_URL}/interviews/${candidateInfo.interviewId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: interviewDuration,
          integrityScore,
          focusLostCount,
          suspiciousEvents
        }),
      });

      setIsRecording(false);
      setCandidateInfo(prev => ({ ...prev, interviewStarted: false }));
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

    } catch (error) {
      console.error('Error ending interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate and download PDF report
const generateReport = async () => {
  if (!candidateInfo.interviewId) return;

  setIsLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/reports/${candidateInfo.interviewId}`, {
      method: 'GET',
    });

    if (!response.ok) throw new Error('Failed to fetch report');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `proctoring-report-${candidateInfo.name}-${Date.now()}.pdf`;
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Failed to generate report. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading screen
  if (isLoading && !candidateInfo.interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading AI Models...
          </h2>
          <p className="text-gray-600">
            Please wait while we initialize the proctoring system
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Initial setup screen
  if (!candidateInfo.interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">
              AI-Powered Video Proctoring System
            </h1>
            <p className="text-gray-600 mt-2">
              Advanced AI monitoring for secure interviews
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateInfo.name}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={candidateInfo.email}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            
            {/* System Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">AI Models</span>
                  <div className={`w-3 h-3 rounded-full ${aiModelsLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Camera Access</span>
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </div>
            
            <button
              onClick={startInterview}
              disabled={!aiModelsLoaded || isLoading}
              className={`w-full py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 ${
                aiModelsLoaded && !isLoading 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4" />
              {isLoading ? 'Starting...' : 'Start Interview'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main interview interface
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                AI Proctored Interview: {candidateInfo.name}
              </h1>
              <p className="text-gray-600">{candidateInfo.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatTime(interviewDuration)}</span>
              </div>
              <button
                onClick={stopRecording}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <StopCircle className="w-4 h-4" />
                {isLoading ? 'Ending...' : 'End Interview'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Candidate Video Feed
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">
                      {isRecording ? 'Recording' : 'Not Recording'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${aiModelsLoaded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">AI Active</span>
                  </div>
                </div>
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 lg:h-96 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* AI Detection Overlay */}
                {currentDetection && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    {currentDetection}
                  </div>
                )}

                {/* AI Status Indicators */}
                <div className="absolute top-4 right-4 space-y-2">
                  {detectionStatus.faceDetected && (
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Face OK
                    </div>
                  )}
                  {detectionStatus.multipleFaces && (
                    <div className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Multiple
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detection Panel */}
          <div className="space-y-4">
            {/* Real-time Status */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                AI Detection Status
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4" />
                    Face Detection
                  </span>
                  <div className={`flex items-center gap-2`}>
                    <div className={`w-3 h-3 rounded-full ${detectionStatus.faceDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {detectionStatus.faceDetected ? 'Active' : 'Missing'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <EyeOff className="w-4 h-4" />
                    Focus Status
                  </span>
                  <div className={`flex items-center gap-2`}>
                    <div className={`w-3 h-3 rounded-full ${detectionStatus.lookingAtScreen ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {detectionStatus.lookingAtScreen ? 'Focused' : 'Distracted'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    Multiple Faces
                  </span>
                  <div className={`flex items-center gap-2`}>
                    <div className={`w-3 h-3 rounded-full ${detectionStatus.multipleFaces ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {detectionStatus.multipleFaces ? 'Detected' : 'Clear'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4" />
                    Phone Detection
                  </span>
                  <div className={`flex items-center gap-2`}>
                    <div className={`w-3 h-3 rounded-full ${detectionStatus.phoneDetected ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {detectionStatus.phoneDetected ? 'Found' : 'Clear'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Book className="w-4 h-4" />
                    Notes/Books
                  </span>
                  <div className={`flex items-center gap-2`}>
                    <div className={`w-3 h-3 rounded-full ${detectionStatus.notesDetected ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {detectionStatus.notesDetected ? 'Found' : 'Clear'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Interview Metrics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Focus Lost</span>
                  <span className="font-semibold text-orange-600 text-lg">{focusLostCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Suspicious Events</span>
                  <span className="font-semibold text-red-600 text-lg">{suspiciousEvents}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Integrity Score</span>
                  <span className={`font-bold text-xl ${
                    integrityScore >= 80 ? 'text-green-600' : 
                    integrityScore >= 60 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {integrityScore}/100
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Integrity Score</span>
                  <span>{integrityScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      integrityScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                      integrityScore >= 60 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${integrityScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={generateReport}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Detection Log */}
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Real-time Detection Log
          </h3>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {detections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No violations detected - System monitoring active</p>
              </div>
            ) : (
              detections.slice(-15).reverse().map((detection) => (
                <div key={detection.id || detection._id} className={`p-3 rounded-md border-l-4 transition-all ${
                  detection.severity === 'error' ? 'bg-red-50 border-red-500' : 
                  detection.severity === 'warning' ? 'bg-orange-50 border-orange-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${
                        detection.severity === 'error' ? 'text-red-800' : 
                        detection.severity === 'warning' ? 'text-orange-800' :
                        'text-blue-800'
                      }`}>
                        {detection.message}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-500">
                          Time: {formatTime(detection.timeInInterview || 0)}
                        </p>
                        {detection.confidence && (
                          <p className="text-xs text-gray-500">
                            Confidence: {Math.round(detection.confidence * 100)}%
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      detection.severity === 'error' ? 'bg-red-200 text-red-800' : 
                      detection.severity === 'warning' ? 'bg-orange-200 text-orange-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {detection.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProctoringSystem;