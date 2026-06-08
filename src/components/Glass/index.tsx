
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import { GlassType, InspirationStatus } from '../../types';
import { liquidColors } from '../../constants/theme';

interface GlassProps {
  type: GlassType;
  completion: number;
  status: InspirationStatus;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  onLongPress?: () => void;
}

export const Glass: React.FC<GlassProps> = ({
  type,
  completion,
  status,
  size = 'medium',
  onPress,
  onLongPress,
}) => {
  const sizeValues = {
    small: { width: 50, height: 70 },
    medium: { width: 80, height: 110 },
    large: { width: 120, height: 165 },
  };

  const { width, height } = sizeValues[size];
  const liquidHeight = (completion / 100) * height * 0.7;

  const animatedLiquidStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(liquidHeight, {
        damping: 12,
        stiffness: 100,
      }),
    };
  });

  const renderGlassShape = () => {
    switch (type) {
      case GlassType.BRANDY:
        return (
          <View style={[styles.glassShape, { width, height }]}>
            <View style={[styles.brandyGlass, { width, height }]} />
          </View>
        );
      case GlassType.CHAMPAGNE:
        return (
          <View style={[styles.glassShape, { width, height }]}>
            <View style={[styles.champagneGlass, { width, height }]} />
          </View>
        );
      default:
        return (
          <View style={[styles.glassShape, { width, height }]}>
            <View style={[styles.defaultGlass, { width, height }]} />
          </View>
        );
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.container}>
        {renderGlassShape()}
        <Animated.View 
          style={[
            styles.liquid, 
            animatedLiquidStyle,
            { 
              backgroundColor: liquidColors[type],
              bottom: height * 0.15,
              width: width * 0.8,
              left: width * 0.1,
            }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glassShape: {
    position: 'relative',
    alignItems: 'center',
  },
  defaultGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
  },
  brandyGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 40,
  },
  champagneGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
  },
  liquid: {
    position: 'absolute',
    borderRadius: 5,
    opacity: 0.8,
  },
});
