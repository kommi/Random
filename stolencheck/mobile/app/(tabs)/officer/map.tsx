import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import client from '../../../api/client';
import { colors, spacing, fontSize } from '../../../constants/theme';

interface MapAlert {
  id: string;
  lat: number;
  lng: number;
  type: string;
  status: string;
  confidence: number;
  item?: {
    title: string;
    scid: string;
    category: string;
  };
}

export default function AlertMapScreen() {
  const [markers, setMarkers] = useState<MapAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const { data } = await client.get('/alerts/map');
      setMarkers(data.alerts || data || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (confidence: number) => {
    if (confidence >= 0.8) return colors.danger;
    if (confidence >= 0.5) return colors.warning;
    return colors.success;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>Loading map data...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 15,
          longitudeDelta: 15,
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lng }}
            pinColor={getMarkerColor(marker.confidence)}
          >
            <Callout>
              <View style={{ padding: spacing.sm, maxWidth: 200 }}>
                <Text style={{ fontWeight: '600', fontSize: fontSize.sm }}>
                  {marker.item?.title || 'Alert'}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {marker.item?.scid || marker.id}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: getMarkerColor(marker.confidence), marginTop: 2 }}>
                  Confidence: {Math.round(marker.confidence * 100)}%
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  Status: {marker.status}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={{
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.lg,
        right: spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger }} />
          <Text style={{ fontSize: fontSize.xs, color: colors.text }}>High</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.warning }} />
          <Text style={{ fontSize: fontSize.xs, color: colors.text }}>Medium</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success }} />
          <Text style={{ fontSize: fontSize.xs, color: colors.text }}>Low</Text>
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
          {markers.length} alerts
        </Text>
      </View>
    </View>
  );
}
