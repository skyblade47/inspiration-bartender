import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import { barColors } from '../../constants/theme';
import { DimensionScore, ScoringDimension } from '../../services/scoring';

interface RadarChartProps {
  dimensionScores: DimensionScore[];
  size?: number;
  showLabels?: boolean;
}

const DIMENSION_ORDER = [
  ScoringDimension.CLARITY,
  ScoringDimension.RICHNESS,
  ScoringDimension.FEASIBILITY,
  ScoringDimension.UNIQUENESS,
];

const DIMENSION_LABELS = {
  [ScoringDimension.CLARITY]: '清晰度',
  [ScoringDimension.RICHNESS]: '丰富度',
  [ScoringDimension.FEASIBILITY]: '可行性',
  [ScoringDimension.UNIQUENESS]: '独特性',
};

export const RadarChart: React.FC<RadarChartProps> = ({
  dimensionScores,
  size = 200,
  showLabels = true,
}) => {
  const center = size / 2;
  const radius = (size / 2) - 30;
  const levels = 5;
  
  const getPointPosition = (index: number, value: number) => {
    const angle = (index * 90 - 90) * (Math.PI / 180);
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const sortedScores = DIMENSION_ORDER.map(dim => {
    const score = dimensionScores.find(s => s.dimension === dim);
    return score ? score.score : 0;
  });

  const dataPoints = sortedScores.map((score, index) => 
    getPointPosition(index, score)
  );

  const gridPoints = Array.from({ length: levels }, (_, levelIndex) => {
    const levelRadius = ((levelIndex + 1) / levels) * radius;
    return DIMENSION_ORDER.map((_, index) => {
      const angle = (index * 90 - 90) * (Math.PI / 180);
      return {
        x: center + levelRadius * Math.cos(angle),
        y: center + levelRadius * Math.sin(angle),
      };
    });
  });

  const axisPoints = DIMENSION_ORDER.map((_, index) => 
    getPointPosition(index, 100)
  );

  const labelPositions = DIMENSION_ORDER.map((_, index) => {
    const angle = (index * 90 - 90) * (Math.PI / 180);
    const labelRadius = radius + 20;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {gridPoints.map((points, levelIndex) => (
          <Polygon
            key={`grid-${levelIndex}`}
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={barColors.outline}
            strokeWidth={1}
            opacity={0.3}
          />
        ))}

        {axisPoints.map((point, index) => (
          <Line
            key={`axis-${index}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke={barColors.outline}
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        <Circle
          cx={center}
          cy={center}
          r={3}
          fill={barColors.primary}
        />

        <Polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill={barColors.primary}
          fillOpacity={0.3}
          stroke={barColors.primary}
          strokeWidth={2}
        />

        {dataPoints.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={barColors.primary}
          />
        ))}

        {showLabels && DIMENSION_ORDER.map((dim, index) => {
          const pos = labelPositions[index];
          const score = sortedScores[index];
          return (
            <SvgText
              key={`label-${index}`}
              x={pos.x}
              y={pos.y}
              fill={barColors.text}
              fontSize={12}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {`${DIMENSION_LABELS[dim]}(${score})`}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});