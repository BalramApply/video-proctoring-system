// aiDetection.js - Real AI Detection Implementation
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

class AIDetectionSystem {
  constructor() {
    this.models = {
      faceDetection: null,
      objectDetection: null,
      poseEstimation: null
    };
    this.isInitialized = false;
    this.detectionThresholds = {
      face: 0.7,
      object: 0.6,
      pose: 0.5
    };
  }

  async initialize() {
    try {
      console.log('Loading AI models...');
      
      // Load BlazeFace for face detection
      this.models.faceDetection = await tf.loadLayersModel(
        'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1'
      );

      // Load COCO-SSD for object detection
      this.models.objectDetection = await tf.loadGraphModel(
        'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1'
      );

      // Load PoseNet for pose estimation
      this.models.poseEstimation = await tf.loadLayersModel(
        'https://tfhub.dev/tensorflow/tfjs-model/posenet/mobilenet/float/075/1/default/1'
      );

      this.isInitialized = true;
      console.log('All AI models loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading AI models:', error);
      return false;
    }
  }

  async detectFaces(videoElement) {
    if (!this.models.faceDetection || !videoElement) return null;

    try {
      // Convert video to tensor
      const tensor = tf.browser.fromPixels(videoElement);
      const resized = tf.image.resizeBilinear(tensor, [128, 128]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      // Run face detection
      const predictions = await this.models.faceDetection.predict(batched).data();
      
      // Process predictions
      const faces = this.processFaceDetections(predictions);
      
      // Cleanup tensors
      tensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();

      return {
        faceCount: faces.length,
        faces: faces,
        confidence: faces.length > 0 ? Math.max(...faces.map(f => f.confidence)) : 0
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  async detectObjects(videoElement) {
    if (!this.models.objectDetection || !videoElement) return null;

    try {
      // Convert video to tensor
      const tensor = tf.browser.fromPixels(videoElement);
      const resized = tf.image.resizeBilinear(tensor, [640, 640]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      // Run object detection
      const predictions = await this.models.objectDetection.predict(batched);
      const [boxes, classes, scores] = predictions;

      // Process predictions
      const objects = await this.processObjectDetections(boxes, classes, scores);
      
      // Cleanup tensors
      tensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      boxes.dispose();
      classes.dispose();
      scores.dispose();

      return this.categorizeObjects(objects);
    } catch (error) {
      console.error('Object detection error:', error);
      return null;
    }
  }

  async detectPose(videoElement) {
    if (!this.models.poseEstimation || !videoElement) return null;

    try {
      // Convert video to tensor
      const tensor = tf.browser.fromPixels(videoElement);
      const resized = tf.image.resizeBilinear(tensor, [257, 257]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      // Run pose estimation
      const predictions = await this.models.poseEstimation.predict(batched);
      const poses = await this.processPoseDetections(predictions);
      
      // Cleanup tensors
      tensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      predictions.dispose();

      return this.analyzePoseForFocus(poses);
    } catch (error) {
      console.error('Pose detection error:', error);
      return null;
    }
  }

  // Process face detection predictions
  processFaceDetections(predictions) {
    const faces = [];
    const numDetections = predictions.length / 17; // BlazeFace outputs 17 values per detection

    for (let i = 0; i < numDetections; i++) {
      const start = i * 17;
      const confidence = predictions[start + 16];
      
      if (confidence > this.detectionThresholds.face) {
        faces.push({
          confidence: confidence,
          bbox: {
            x: predictions[start],
            y: predictions[start + 1],
            width: predictions[start + 2] - predictions[start],
            height: predictions[start + 3] - predictions[start + 1]
          },
          landmarks: this.extractFaceLandmarks(predictions, start)
        });
      }
    }

    return faces;
  }

  // Extract face landmarks for gaze detection
  extractFaceLandmarks(predictions, start) {
    const landmarks = {};
    const landmarkNames = ['rightEye', 'leftEye', 'noseTip', 'mouth', 'rightEarTragion', 'leftEarTragion'];
    
    for (let i = 0; i < landmarkNames.length; i++) {
      landmarks[landmarkNames[i]] = {
        x: predictions[start + 4 + i * 2],
        y: predictions[start + 5 + i * 2]
      };
    }

    return landmarks;
  }

  // Process object detection predictions
  async processObjectDetections(boxes, classes, scores) {
    const boxesData = await boxes.data();
    const classesData = await classes.data();
    const scoresData = await scores.data();

    const objects = [];
    const numDetections = scoresData.length;

    for (let i = 0; i < numDetections; i++) {
      if (scoresData[i] > this.detectionThresholds.object) {
        const classId = classesData[i];
        const className = this.getCocoClassName(classId);
        
        objects.push({
          class: className,
          classId: classId,
          confidence: scoresData[i],
          bbox: {
            y: boxesData[i * 4],
            x: boxesData[i * 4 + 1],
            height: boxesData[i * 4 + 2] - boxesData[i * 4],
            width: boxesData[i * 4 + 3] - boxesData[i * 4 + 1]
          }
        });
      }
    }

    return objects;
  }

  // Process pose detection predictions
  async processPoseDetections(predictions) {
    const heatmaps = predictions[0];
    const offsets = predictions[1];

    // Get pose keypoints
    const poses = await this.decodePoses(heatmaps, offsets);
    
    return poses;
  }

  // Decode pose keypoints from heatmaps and offsets
  async decodePoses(heatmaps, offsets) {
    const heatmapData = await heatmaps.data();
    const offsetsData = await offsets.data();
    
    // Simplified pose decoding - in production, use proper pose decoding algorithms
    const poses = [];
    const numKeypoints = 17; // COCO pose format
    
    // Find peak positions in heatmaps
    for (let i = 0; i < numKeypoints; i++) {
      const maxIndex = this.findHeatmapPeak(heatmapData, i, 33, 33); // 33x33 heatmap
      if (maxIndex) {
        poses.push({
          part: this.getPosePartName(i),
          position: maxIndex,
          confidence: heatmapData[maxIndex.index]
        });
      }
    }

    return poses;
  }

  // Find peak in heatmap for a specific body part
  findHeatmapPeak(heatmapData, partId, height, width) {
    let maxVal = -1;
    let maxIndex = -1;
    let maxY = 0;
    let maxX = 0;

    const offset = partId * height * width;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = offset + y * width + x;
        if (heatmapData[index] > maxVal) {
          maxVal = heatmapData[index];
          maxIndex = index;
          maxY = y;
          maxX = x;
        }
      }
    }

    return maxVal > this.detectionThresholds.pose ? {
      x: maxX,
      y: maxY,
      index: maxIndex,
      confidence: maxVal
    } : null;
  }

  // Get pose part name by index
  getPosePartName(index) {
    const posePartNames = [
      'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
      'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
      'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
      'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'
    ];
    return posePartNames[index] || 'unknown';
  }

  // Categorize detected objects into suspicious categories
  categorizeObjects(objects) {
    const categories = {
      phones: [],
      books: [],
      devices: [],
      other: []
    };

    const phoneClasses = ['cell phone', 'mobile phone'];
    const bookClasses = ['book'];
    const deviceClasses = ['laptop', 'tv', 'monitor', 'tablet', 'computer'];

    objects.forEach(obj => {
      const className = obj.class.toLowerCase();
      
      if (phoneClasses.some(cls => className.includes(cls))) {
        categories.phones.push(obj);
      } else if (bookClasses.some(cls => className.includes(cls))) {
        categories.books.push(obj);
      } else if (deviceClasses.some(cls => className.includes(cls))) {
        categories.devices.push(obj);
      } else {
        categories.other.push(obj);
      }
    });

    return {
      phoneDetected: categories.phones.length > 0,
      booksDetected: categories.books.length > 0,
      devicesDetected: categories.devices.length > 0,
      detectedObjects: categories,
      totalObjects: objects.length
    };
  }

  // Analyze pose for focus detection
  analyzePoseForFocus(poses) {
    if (!poses || poses.length === 0) return null;

    // Find key body parts for focus analysis
    const nose = poses.find(p => p.part === 'nose');
    const leftEye = poses.find(p => p.part === 'leftEye');
    const rightEye = poses.find(p => p.part === 'rightEye');
    const leftShoulder = poses.find(p => p.part === 'leftShoulder');
    const rightShoulder = poses.find(p => p.part === 'rightShoulder');

    if (!nose || !leftEye || !rightEye) {
      return { lookingAtScreen: false, confidence: 0 };
    }

    // Calculate head orientation
    const eyeCenter = {
      x: (leftEye.position.x + rightEye.position.x) / 2,
      y: (leftEye.position.y + rightEye.position.y) / 2
    };

    const noseToEyeVector = {
      x: nose.position.x - eyeCenter.x,
      y: nose.position.y - eyeCenter.y
    };

    // Calculate angle - simplified gaze estimation
    const angle = Math.atan2(noseToEyeVector.y, noseToEyeVector.x) * 180 / Math.PI;
    const normalizedAngle = Math.abs(angle);

    // Determine if looking at screen (facing forward)
    const isLookingAtScreen = normalizedAngle < 30; // Within 30 degrees of center
    const confidence = Math.max(0, (30 - normalizedAngle) / 30);

    // Check for proper posture
    let postureScore = 1;
    if (leftShoulder && rightShoulder) {
      const shoulderAngle = Math.atan2(
        rightShoulder.position.y - leftShoulder.position.y,
        rightShoulder.position.x - leftShoulder.position.x
      ) * 180 / Math.PI;
      
      // Penalize for tilted posture
      postureScore = Math.max(0.3, 1 - Math.abs(shoulderAngle) / 90);
    }

    return {
      lookingAtScreen: isLookingAtScreen,
      confidence: confidence * postureScore,
      headAngle: normalizedAngle,
      postureScore: postureScore,
      keypoints: poses
    };
  }

  // Get COCO class name by ID
  getCocoClassName(classId) {
    const cocoClasses = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
      'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
      'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
      'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
      'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
      'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
      'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
      'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
      'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
      'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
      'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
      'toothbrush'
    ];
    
    return cocoClasses[classId] || 'unknown';
  }

  // Main detection function that combines all detections
  async performCompleteDetection(videoElement) {
    if (!this.isInitialized || !videoElement) {
      return null;
    }

    try {
      // Run all detections in parallel for better performance
      const [faceResults, objectResults, poseResults] = await Promise.all([
        this.detectFaces(videoElement),
        this.detectObjects(videoElement),
        this.detectPose(videoElement)
      ]);

      // Combine results
      const combinedResults = {
        timestamp: Date.now(),
        faces: faceResults,
        objects: objectResults,
        pose: poseResults,
        
        // Derived detection flags
        faceDetected: faceResults && faceResults.faceCount > 0,
        multipleFaces: faceResults && faceResults.faceCount > 1,
        phoneDetected: objectResults && objectResults.phoneDetected,
        notesDetected: objectResults && objectResults.booksDetected,
        deviceDetected: objectResults && objectResults.devicesDetected,
        lookingAtScreen: poseResults && poseResults.lookingAtScreen,
        
        // Confidence scores
        overallConfidence: this.calculateOverallConfidence(faceResults, objectResults, poseResults)
      };

      return combinedResults;
    } catch (error) {
      console.error('Complete detection error:', error);
      return null;
    }
  }

  // Calculate overall confidence score
  calculateOverallConfidence(faceResults, objectResults, poseResults) {
    let totalConfidence = 0;
    let componentCount = 0;

    if (faceResults && faceResults.confidence) {
      totalConfidence += faceResults.confidence;
      componentCount++;
    }

    if (poseResults && poseResults.confidence) {
      totalConfidence += poseResults.confidence;
      componentCount++;
    }

    // Object detection confidence is handled per object
    if (objectResults && objectResults.totalObjects > 0) {
      const avgObjectConfidence = Object.values(objectResults.detectedObjects)
        .flat()
        .reduce((sum, obj) => sum + obj.confidence, 0) / objectResults.totalObjects;
      totalConfidence += avgObjectConfidence;
      componentCount++;
    }

    return componentCount > 0 ? totalConfidence / componentCount : 0;
  }

  // Check if models are loaded and ready
  isReady() {
    return this.isInitialized && 
           this.models.faceDetection && 
           this.models.objectDetection && 
           this.models.poseEstimation;
  }

  // Dispose of all models to free memory
  dispose() {
    Object.values(this.models).forEach(model => {
      if (model && typeof model.dispose === 'function') {
        model.dispose();
      }
    });
    
    this.models = {
      faceDetection: null,
      objectDetection: null,
      poseEstimation: null
    };
    
    this.isInitialized = false;
  }
}

// Export singleton instance
const aiDetectionSystem = new AIDetectionSystem();
export default aiDetectionSystem;

// Example usage in React component:
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

// In your detection loop
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