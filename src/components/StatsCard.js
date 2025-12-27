import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export const StatsCard = ({ label, value, icon, onPress }) => {
  const CardContent = (
    <View style={[styles.card, onPress && styles.cardClickable]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7} 
        style={styles.touchableContainer}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchableContainer}>{CardContent}</View>;
};

const styles = StyleSheet.create({
  touchableContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardClickable: {
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 4,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.lavender,
    textAlign: 'center',
    fontWeight: '600',
  },
});