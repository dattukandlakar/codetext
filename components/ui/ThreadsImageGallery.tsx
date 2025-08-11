import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface ImageData {
  uri: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

interface ThreadsImageGalleryProps {
  images: string[] | ImageData[];
  onImagePress?: (imageUri: string, index: number) => void;
  containerPadding?: number;
  maxImageHeight?: number;
  imageSpacing?: number;
}

export const ThreadsImageGallery: React.FC<ThreadsImageGalleryProps> = ({
  images,
  onImagePress,
  containerPadding = 16,
  maxImageHeight = 220, // Reduced from 280 to 220
  imageSpacing = 8,
}) => {
  const [imageDimensions, setImageDimensions] = useState<{ [key: string]: { width: number; height: number } }>({});

  const handleImageLoad = (imageUri: string, width: number, height: number) => {
    setImageDimensions(prev => ({
      ...prev,
      [imageUri]: { width, height }
    }));
  };

  const getImageStyle = (imageUri: string, index: number) => {
    const dimensions = imageDimensions[imageUri];
    
    if (!dimensions) {
      // Default dimensions while loading
      return {
        width: maxImageHeight * 1.2, // Default aspect ratio of 1.2:1
        height: maxImageHeight,
        borderRadius: 12,
      };
    }

    const aspectRatio = dimensions.width / dimensions.height;
    let imageWidth = maxImageHeight * aspectRatio;
    let imageHeight = maxImageHeight;

    // Ensure minimum width for very tall images
    const minWidth = 120;
    if (imageWidth < minWidth) {
      imageWidth = minWidth;
      imageHeight = minWidth / aspectRatio;
    }

    // Ensure maximum width for very wide images
    const maxWidth = width - (containerPadding * 2);
    if (imageWidth > maxWidth && images.length === 1) {
      imageWidth = maxWidth;
      imageHeight = maxWidth / aspectRatio;
    }

    return {
      width: imageWidth,
      height: imageHeight,
      borderRadius: 12,
    };
  };

  const renderImage = (item: string | ImageData, index: number) => {
    const imageUri = typeof item === 'string' ? item : item.uri;
    const imageStyle = getImageStyle(imageUri, index);

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.9}
        onPress={() => onImagePress?.(imageUri, index)}
        style={[styles.imageContainer, { marginRight: index === images.length - 1 ? 0 : imageSpacing }]}
      >
        <Image
          source={{ uri: imageUri }}
          style={imageStyle}
          resizeMode="cover"
          onLoad={(event) => {
            const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
            handleImageLoad(imageUri, imgWidth, imgHeight);
          }}
        />
      </TouchableOpacity>
    );
  };

  if (!images || images.length === 0) return null;

  return (
    <View style={styles.container}>
      {images.length === 1 ? (
        // Single image - full width
        <View style={styles.singleImageContainer}>
          {renderImage(images[0], 0)}
        </View>
      ) : (
        // Multiple images - horizontal scroll
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: containerPadding }
          ]}
          style={styles.scrollView}
        >
          {images.map((item, index) => renderImage(item, index))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  singleImageContainer: {
    alignItems: 'center', // Center single images horizontally
  },
  scrollView: {
    marginHorizontal: -16, // Offset container padding
  },
  scrollContent: {
    paddingRight: 16, // Add padding to the end
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
});

export default ThreadsImageGallery;
