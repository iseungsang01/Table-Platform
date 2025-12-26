import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { formatDate } from '../utils/formatters';
import { Colors } from '../constants/Colors';

/**
 * 공지사항 카드 컴포넌트
 * 개별 공지사항을 표시 (Markdown 링크 지원)
 * 
 * @param {object} notice - 공지사항 데이터 { id, title, content, created_at, is_pinned }
 */
export const NoticeCard = ({ notice }) => {
  // Markdown 링크를 파싱하여 클릭 가능한 링크로 변환
  const parseContent = (content) => {
    // [텍스트](URL) 형식의 링크를 찾음
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      // 링크 앞의 일반 텍스트
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }

      // 링크
      parts.push({
        type: 'link',
        text: match[1],
        url: match[2],
      });

      lastIndex = match.index + match[0].length;
    }

    // 마지막 남은 텍스트
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const contentParts = parseContent(notice.content);

  return (
    <View style={[styles.card, notice.is_pinned && styles.cardPinned]}>
      {notice.is_pinned && (
        <View style={styles.pinBadge}>
          <Text style={styles.pinBadgeText}>📌 고정</Text>
        </View>
      )}

      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.date}>{formatDate(notice.created_at)}</Text>

      <View style={styles.content}>
        {contentParts.map((part, index) => {
          if (part.type === 'link') {
            return (
              <Text
                key={index}
                style={styles.link}
                onPress={() => handleLinkPress(part.url)}
              >
                {part.text}
              </Text>
            );
          }
          return (
            <Text key={index} style={styles.text}>
              {part.content}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    position: 'relative',
  },
  cardPinned: {
    borderColor: Colors.gold,
  },
  pinBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#b8860b',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pinBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.purpleDark,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
  },
  date: {
    fontSize: 13,
    color: Colors.lavender,
    opacity: 0.8,
    marginBottom: 15,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  link: {
    fontSize: 16,
    color: Colors.gold,
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
});