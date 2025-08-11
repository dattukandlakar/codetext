import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { 
  X, 
  RotateCcw, 
  Circle, 
  Square,
  Flash,
  FlashOff,
  Zap,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScreenProps {
  visible: boolean;
  onClose: () => void;
  onMediaCaptured: (uri: string, type: 'image' | 'video') => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  visible,
  onClose,
  onMediaCaptured,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants?.FlashMode?.off || 'off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  
  const cameraRef = useRef<Camera>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      getCameraPermissions();
    }
  }, [visible]);

  useEffect(() => {
    if (isRecording) {
      // Start recording animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Stop animation and timer
      recordingAnimation.stopAnimation();
      recordingAnimation.setValue(1);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [isRecording]);

  const getCameraPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      setHasPermission(false);
    }
  };

  const toggleCameraType = () => {
    setType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const toggleFlashMode = () => {
    setFlashMode(current => {
      if (current === Camera.Constants?.FlashMode?.off) {
        return Camera.Constants?.FlashMode?.on || 'on';
      } else if (current === Camera.Constants?.FlashMode?.on) {
        return Camera.Constants?.FlashMode?.auto || 'auto';
      } else {
        return Camera.Constants?.FlashMode?.off || 'off';
      }
    });
  };

  const getFlashIcon = () => {
    if (flashMode === Camera.Constants?.FlashMode?.on || flashMode === 'on') {
      return <Zap size={24} color="#fff" />;
    } else if (flashMode === Camera.Constants?.FlashMode?.auto || flashMode === 'auto') {
      return <Flash size={24} color="#fff" />;
    } else {
      return <FlashOff size={24} color="#fff" />;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      onMediaCaptured(photo.uri, 'image');
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        quality: Camera.Constants?.VideoQuality?.['720p'] || '720p',
        maxDuration: 15, // 15 seconds max like Instagram
        mute: false,
      });

      if (video) {
        onMediaCaptured(video.uri, 'video');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const handleCapturePress = () => {
    if (captureMode === 'photo') {
      takePicture();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to capture photos and videos for your stories.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={getCameraPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        flashMode={flashMode}
        ratio="16:9"
      >
        {/* Header Controls */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <X size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Story</Text>
            {isRecording && (
              <Text style={styles.recordingDuration}>
                {formatDuration(recordingDuration)}
              </Text>
            )}
          </View>
          
          <TouchableOpacity onPress={toggleFlashMode} style={styles.headerButton}>
            {getFlashIcon()}
          </TouchableOpacity>
        </View>

        {/* Recording Indicator */}
        {isRecording && (
          <Animated.View style={[styles.recordingIndicator, { opacity: recordingAnimation }]}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </Animated.View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Capture Mode Toggle */}
          <View style={styles.captureModeContainer}>
            <TouchableOpacity
              style={[
                styles.captureModeButton,
                captureMode === 'photo' && styles.captureModeActive
              ]}
              onPress={() => setCaptureMode('photo')}
            >
              <ImageIcon size={20} color={captureMode === 'photo' ? Colors.dark.primary : '#fff'} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.captureModeButton,
                captureMode === 'video' && styles.captureModeActive
              ]}
              onPress={() => setCaptureMode('video')}
            >
              <VideoIcon size={20} color={captureMode === 'video' ? Colors.dark.primary : '#fff'} />
            </TouchableOpacity>
          </View>

          {/* Capture Button */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              isRecording && styles.captureButtonRecording
            ]}
            onPress={handleCapturePress}
            onLongPress={captureMode === 'video' ? startRecording : undefined}
            onPressOut={captureMode === 'video' && isRecording ? stopRecording : undefined}
          >
            <View style={[
              styles.captureButtonInner,
              captureMode === 'video' && styles.captureButtonVideo,
              isRecording && styles.captureButtonRecordingInner
            ]} />
          </TouchableOpacity>

          {/* Flip Camera Button */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <RotateCcw size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            {captureMode === 'photo' ? 'Tap to capture' : isRecording ? 'Tap to stop recording' : 'Hold to record'}
          </Text>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  
  // Permission Styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },

  // Header Styles
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  recordingDuration: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Recording Indicator
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // Capture Mode Toggle
  captureModeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  captureModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureModeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },

  // Capture Button
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonRecording: {
    borderColor: '#ff4444',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  captureButtonVideo: {
    backgroundColor: '#ff4444',
  },
  captureButtonRecordingInner: {
    borderRadius: 8,
    width: 24,
    height: 24,
  },

  // Flip Button
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Instructions
  instructionsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default CameraScreen;

