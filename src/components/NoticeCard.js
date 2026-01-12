import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { formatDate } from '../utils/formatters';
import { DrawerTheme } from '../constants/DrawerTheme';

export const NoticeCard = ({ notice }) => {
  const parseContent = (content) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'link',
        text: match[1],
        url: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) => console.error('링크 열기 실패:', err));
  };

  const contentParts = parseContent(notice.content);

  return (
    <View style={[styles.card, notice.is_pinned && styles.cardPinned]}>
      {notice.is_pinned && (
        <View style={styles.pinBadge}>
          <Text style={styles.pinBadgeText}>중요</Text>
        </View>
      )}

      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.date}>{formatDate(notice.created_at)}</Text>

      <View style={styles.contentContainer}>
        {contentParts.map((part, index) => {
          if (part.type === 'link') {
            return (
              <Text
                key={index}
                style={styles.linkText}
                onPress={() => handleLinkPress(part.url)}
              >
                {part.text}
              </Text>
            );
          }
          return (
            <Text key={index} style={styles.bodyText}>
              {part.content}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 🪵 일반 카드: 테두리 없이 면 분할과 그림자로 구분
  card: {
    backgroundColor: '#4A3728', // 서랍 내부 느낌의 약간 밝은 브라운
    borderRadius: 16,
    padding: 22,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  // 중요 공지는 배경색을 조금 더 강조
  cardPinned: {
    backgroundColor: '#5D4333',
  },
  // 뱃지 디자인: 테두리 없이 깔끔하게
  pinBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: DrawerTheme.goldBrass,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pinBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3D2B1F', // 배경색과 대비되는 어두운 색
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    paddingRight: 40, // 뱃지와 겹치지 않게
  },
  date: {
    fontSize: 12,
    color: '#A68966',
    marginBottom: 18,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)', // 아주 미세한 구분선
  },
  bodyText: {
    fontSize: 15,
    color: '#D4C4B5',
    lineHeight: 24,
  },
  linkText: {
    fontSize: 15,
    color: DrawerTheme.goldBrass,
    lineHeight: 24,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});