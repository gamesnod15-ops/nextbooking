import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyle = styles[variant];
  const textVariant = textStyles[variant];
  const sizeStyle = sizeStyles[size];
  const textSizeStyle = textSizeStyles[size];
  const shadow = variant === 'primary' ? SHADOW.primary : {};

  return (
    <TouchableOpacity
      style={[styles.base, variantStyle, sizeStyle, shadow, disabled || loading ? styles.disabled : {}, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? COLORS.white : COLORS.primary} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.baseText, textVariant, textSizeStyle, textStyle]}>{children}</Text>
          {iconRight && <>{iconRight}</>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.lg,
  },
  baseText: {
    fontWeight: FONT.semibold,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surfaceAlt,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: COLORS.errorLight,
  },
  disabled: {
    opacity: 0.5,
  },
});

const textStyles = StyleSheet.create({
  primary: { color: COLORS.white },
  secondary: { color: COLORS.text },
  outline: { color: COLORS.text },
  ghost: { color: COLORS.text },
  destructive: { color: COLORS.errorText },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  md: { paddingHorizontal: 20, paddingVertical: 13 },
  lg: { paddingHorizontal: 28, paddingVertical: 16 },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: FONT.sm },
  md: { fontSize: FONT.base },
  lg: { fontSize: FONT.md },
});
