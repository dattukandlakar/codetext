import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Modal,
  ScrollView,
  Animated,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Type,
  Smile,
  Palette,
  Download,
  Send,
  RotateCcw,
  Crop,
  Sliders,
  Music,
  AtSign,
  MapPin,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  alignment: 'left' | 'center' | 'right';
}

interface StickerElement {
  id: string;
  type: 'emoji' | 'gif' | 'sticker';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface DrawingPath {
  id: string;
  path: { x: number; y: number }[];
  color: string;
  thickness: number;
}

interface StoryEditorProps {
  mediaUri: string;
  mediaType: 'image' | 'video';
  onSave: (editedStory: any) => void;
  onDiscard: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  mediaUri,
  mediaType,
  onSave,
  onDiscard,
  isUploading = false,
  uploadProgress = 0,
}) => {
  // State management
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [stickerElements, setStickerElements] = useState<StickerElement[]>([]);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  
  // UI State
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  
  // Text input state
  const [textInputValue, setTextInputValue] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState('#ffffff');
  const [selectedBgColor, setSelectedBgColor] = useState('transparent');
  const [selectedFontSize, setSelectedFontSize] = useState(24);
  const [selectedFontFamily, setSelectedFontFamily] = useState('System');
  const [selectedAlignment, setSelectedAlignment] = useState<'left' | 'center' | 'right'>('center');
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingPath, setCurrentDrawingPath] = useState<{ x: number; y: number }[]>([]);
  const [selectedDrawingColor, setSelectedDrawingColor] = useState('#ffffff');
  const [selectedThickness, setSelectedThickness] = useState(5);

  // Color palettes
  const textColors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#ffc0cb', '#a52a2a', '#808080', '#008000', '#000080'
  ];

  const backgroundColors = [
    'transparent', '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ];

  // Popular emojis and stickers
  const emojis = [
    '😀', '😂', '🥰', '😍', '🤔', '😎', '🔥', '💯',
    '❤️', '💖', '👍', '👌', '✨', '🌟', '🎉', '💪',
    '🌈', '⚡', '💎', '🦋', '🌸', '🍀', '🌙', '☀️'
  ];

  const fontFamilies = [
    'System',
    'Helvetica',
    'Times New Roman',
    'Courier',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
  ];

  // Text Functions
  const addTextElement = () => {
    if (!textInputValue.trim()) return;

    const newId = Date.now().toString();
    const newElement: TextElement = {
      id: newId,
      text: textInputValue,
      x: screenWidth / 2,
      y: screenHeight / 3,
      scale: 1,
      rotation: 0,
      color: selectedTextColor,
      backgroundColor: selectedBgColor,
      fontSize: selectedFontSize,
      fontFamily: selectedFontFamily,
      alignment: selectedAlignment,
    };

    setTextElements(prev => [...prev, newElement]);
    setActiveTextId(newId);
    setTextInputValue('');
    setShowTextInput(false);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const deleteTextElement = (id: string) => {
    setTextElements(prev => prev.filter(element => element.id !== id));
    setActiveTextId(null);
  };

  // Sticker Functions
  const addStickerElement = (content: string, type: 'emoji' | 'gif' | 'sticker' = 'emoji') => {
    const newElement: StickerElement = {
      id: Date.now().toString(),
      type,
      content,
      x: screenWidth / 2,
      y: screenHeight / 3,
      scale: 1,
      rotation: 0,
    };

    setStickerElements(prev => [...prev, newElement]);
    setShowStickerPicker(false);
  };

  const deleteStickerElement = (id: string) => {
    setStickerElements(prev => prev.filter(element => element.id !== id));
  };

  // Drawing Functions
  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    setCurrentDrawingPath([{ x, y }]);
  };

  const continueDrawing = (x: number, y: number) => {
    if (isDrawing) {
      setCurrentDrawingPath(prev => [...prev, { x, y }]);
    }
  };

  const endDrawing = () => {
    if (currentDrawingPath.length > 1) {
      const newPath: DrawingPath = {
        id: Date.now().toString(),
        path: currentDrawingPath,
        color: selectedDrawingColor,
        thickness: selectedThickness,
      };
      setDrawingPaths(prev => [...prev, newPath]);
    }
    setIsDrawing(false);
    setCurrentDrawingPath([]);
  };

  const clearDrawing = () => {
    setDrawingPaths([]);
    setCurrentDrawingPath([]);
    setIsDrawing(false);
  };

  // Save and Share Functions
  const handleSave = () => {
    const storyData = {
      mediaUri,
      mediaType,
      textElements,
      stickerElements,
      drawingPaths,
      timestamp: new Date().toISOString(),
    };

    onSave(storyData);
  };

  const handleDiscard = () => {
    if (textElements.length > 0 || stickerElements.length > 0 || drawingPaths.length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onDiscard },
        ]
      );
    } else {
      onDiscard();
    }
  };

  // Render Functions
  const renderTextInputModal = () => (
    <Modal
      visible={showTextInput}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTextInput(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.textInputContainer}>
          <View style={styles.textInputHeader}>
            <TouchableOpacity onPress={() => setShowTextInput(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.textInputTitle}>Add Text</Text>
            <TouchableOpacity onPress={addTextElement}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.textInput,
              {
                color: selectedTextColor,
                backgroundColor: selectedBgColor,
                fontSize: selectedFontSize,
                fontFamily: selectedFontFamily,
                textAlign: selectedAlignment,
              }
            ]}
            value={textInputValue}
            onChangeText={setTextInputValue}
            placeholder="Type your text..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            autoFocus
          />

          {/* Font Options */}
          <View style={styles.textOptions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {fontFamilies.map((font) => (
                <TouchableOpacity
                  key={font}
                  style={[
                    styles.fontOption,
                    selectedFontFamily === font && styles.fontOptionActive
                  ]}
                  onPress={() => setSelectedFontFamily(font)}
                >
                  <Text style={[styles.fontOptionText, { fontFamily: font }]}>
                    Aa
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Color Options */}
          <View style={styles.colorOptions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {textColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedTextColor === color && styles.colorOptionActive
                  ]}
                  onPress={() => setSelectedTextColor(color)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Size Slider */}
          <View style={styles.sizeSliderContainer}>
            <Text style={styles.sizeLabel}>Size</Text>
            {/* You would implement a proper slider here */}
            <View style={styles.sizeButtons}>
              {[16, 20, 24, 28, 32, 36].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedFontSize === size && styles.sizeButtonActive
                  ]}
                  onPress={() => setSelectedFontSize(size)}
                >
                  <Text style={styles.sizeButtonText}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStickerModal = () => (
    <Modal
      visible={showStickerPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStickerPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.stickerContainer}>
          <View style={styles.stickerHeader}>
            <TouchableOpacity onPress={() => setShowStickerPicker(false)}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
            <Text style={styles.stickerTitle}>Add Emoji</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView contentContainerStyle={styles.stickerGrid}>
            {emojis.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stickerOption}
                onPress={() => addStickerElement(emoji)}
              >
                <Text style={styles.stickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDrawingTools = () => (
    <View style={styles.drawingTools}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {textColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.drawingColorOption,
              { backgroundColor: color },
              selectedDrawingColor === color && styles.drawingColorActive
            ]}
            onPress={() => setSelectedDrawingColor(color)}
          />
        ))}
      </ScrollView>
      
      <View style={styles.thicknessOptions}>
        {[2, 5, 8, 12].map((thickness) => (
          <TouchableOpacity
            key={thickness}
            style={[
              styles.thicknessOption,
              selectedThickness === thickness && styles.thicknessActive
            ]}
            onPress={() => setSelectedThickness(thickness)}
          >
            <View 
              style={[
                styles.thicknessDot,
                { 
                  width: thickness * 2, 
                  height: thickness * 2, 
                  borderRadius: thickness,
                  backgroundColor: selectedDrawingColor 
                }
              ]} 
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.clearDrawingButton}
        onPress={clearDrawing}
      >
        <Text style={styles.clearDrawingText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Media Display */}
      <View style={styles.mediaContainer}>
        {mediaType === 'image' ? (
          <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>Video Story</Text>
          </View>
        )}

        {/* Overlay Elements */}
        {textElements.map((element) => (
          <TouchableOpacity
            key={element.id}
            style={[
              styles.textElement,
              {
                left: element.x - 50,
                top: element.y - 25,
                transform: [
                  { scale: element.scale },
                  { rotate: `${element.rotation}deg` }
                ]
              }
            ]}
            onPress={() => setActiveTextId(element.id)}
            onLongPress={() => deleteTextElement(element.id)}
          >
            <View
              style={[
                styles.textElementContent,
                { backgroundColor: element.backgroundColor }
              ]}
            >
              <Text
                style={[
                  styles.textElementText,
                  {
                    color: element.color,
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    textAlign: element.alignment,
                  }
                ]}
              >
                {element.text}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {stickerElements.map((element) => (
          <TouchableOpacity
            key={element.id}
            style={[
              styles.stickerElement,
              {
                left: element.x - 25,
                top: element.y - 25,
                transform: [
                  { scale: element.scale },
                  { rotate: `${element.rotation}deg` }
                ]
              }
            ]}
            onLongPress={() => deleteStickerElement(element.id)}
          >
            <Text style={styles.stickerContent}>{element.content}</Text>
          </TouchableOpacity>
        ))}

        {/* Drawing Paths - SVG would be better but using View for simplicity */}
        {drawingPaths.map((path) => (
          <View key={path.id} style={styles.drawingPath}>
            {/* Drawing implementation would require SVG or Canvas */}
          </View>
        ))}
      </View>

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Story</Text>
        
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.shareButton, isUploading && styles.shareButtonDisabled]}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Send size={18} color="#fff" />
              <Text style={styles.shareText}>Share</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Side Tools */}
      <View style={styles.sideTools}>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => setShowTextInput(true)}
        >
          <Type size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => setShowStickerPicker(true)}
        >
          <Smile size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolButton,
            showDrawingTools && styles.toolButtonActive
          ]}
          onPress={() => setShowDrawingTools(!showDrawingTools)}
        >
          <Palette size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton}>
          <Music size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton}>
          <AtSign size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton}>
          <MapPin size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Drawing Tools */}
      {showDrawingTools && renderDrawingTools()}

      {/* Progress Indicator */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.uploadText}>
              Uploading Story... {uploadProgress}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
              />
            </View>
          </View>
        </View>
      )}

      {/* Modals */}
      {renderTextInputModal()}
      {renderStickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  videoText: {
    color: '#fff',
    fontSize: 18,
  },

  // Header
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Side Tools
  sideTools: {
    position: 'absolute',
    right: 20,
    top: '30%',
    bottom: '30%',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  toolButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  toolButtonActive: {
    backgroundColor: Colors.dark.primary,
  },

  // Text Elements
  textElement: {
    position: 'absolute',
    zIndex: 5,
  },
  textElementContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 100,
  },
  textElementText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Sticker Elements
  stickerElement: {
    position: 'absolute',
    zIndex: 5,
  },
  stickerContent: {
    fontSize: 48,
  },

  // Drawing
  drawingPath: {
    position: 'absolute',
    zIndex: 3,
  },
  drawingTools: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 16,
    zIndex: 10,
  },
  drawingColorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  drawingColorActive: {
    borderColor: '#fff',
  },
  thicknessOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 15,
  },
  thicknessOption: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  thicknessActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  thicknessDot: {
    backgroundColor: '#fff',
  },
  clearDrawingButton: {
    backgroundColor: Colors.dark.error || '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
  },
  clearDrawingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },

  // Text Input Modal
  textInputContainer: {
    backgroundColor: Colors.dark.surface,
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  textInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  textInputTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  doneText: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    minHeight: 100,
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  textOptions: {
    marginBottom: 16,
  },
  fontOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.dark.background,
    borderRadius: 20,
    marginRight: 8,
  },
  fontOptionActive: {
    backgroundColor: Colors.dark.primary,
  },
  fontOptionText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  colorOptions: {
    marginBottom: 16,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: Colors.dark.primary,
    borderWidth: 3,
  },
  sizeSliderContainer: {
    marginBottom: 16,
  },
  sizeLabel: {
    color: Colors.dark.text,
    fontSize: 16,
    marginBottom: 8,
  },
  sizeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.dark.background,
    borderRadius: 16,
  },
  sizeButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  sizeButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
  },

  // Sticker Modal
  stickerContainer: {
    backgroundColor: Colors.dark.surface,
    marginTop: screenHeight * 0.3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
  },
  stickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  stickerTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 15,
  },
  stickerOption: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: 30,
  },
  stickerEmoji: {
    fontSize: 32,
  },

  // Upload Overlay
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  uploadContainer: {
    backgroundColor: Colors.dark.surface,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  uploadText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
  },
});

export default StoryEditor;