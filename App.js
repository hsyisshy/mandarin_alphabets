import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// 🚨 WARNING: Do not expose your API key. It will be stolen.
const OPENAI_API_KEY = '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';

// --- Data Source ---
const initialBopomofoData = [
  { symbol: 'ㄅ', word: '包子', emoji: '🥟', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄆ', word: '葡萄', emoji: '🍇', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄇ', word: '帽子', emoji: '👒', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄈ', word: '飛機', emoji: '✈️', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄉ', word: '刀子', emoji: '🔪', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄊ', word: '兔子', emoji: '🐰', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄋ', word: '牛奶', emoji: '🥛', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄌ', word: '老虎', emoji: '🐯', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄍ', word: '鴿子', emoji: '🐦', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄎ', word: '咖啡', emoji: '☕️', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄏ', word: '孩子', emoji: '👶', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄐ', word: '雞', emoji: '🐓', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄑ', word: '氣球', emoji: '🎈', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄒ', word: '西瓜', emoji: '🍉', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄓ', word: '蜘蛛', emoji: '🕷️', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄔ', word: '吃飯', emoji: '🍽️', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄕ', word: '獅子', emoji: '🦁', aiImageUrl: null, isLoading: false},
  { symbol: 'ㄖ', word: '日曆', emoji: '📅', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄗ', word: '鑽石', emoji: '💎', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄘ', word: '草莓', emoji: '🍓', aiImageUrl: null, isLoading: false },
  { symbol: 'ㄙ', word: '松鼠', emoji: '🐿️', aiImageUrl: null, isLoading: false },
];

// --- Selection Screen Component ---
const SelectionScreen = ({ onStart }) => {
  const [selection, setSelection] = useState(() => {
    const initialSelection = {};
    initialBopomofoData.forEach(item => {
      initialSelection[item.symbol] = false;
    });
    return initialSelection;
  });

  const toggleSelection = (symbol) => {
    setSelection(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  const handleSelectAll = (isSelected) => {
    const newSelection = {};
    initialBopomofoData.forEach(item => {
        newSelection[item.symbol] = isSelected;
    });
    setSelection(newSelection);
  };

  const handleStart = () => {
    const selectedSymbols = Object.keys(selection).filter(key => selection[key]);
    const activeData = JSON.parse(JSON.stringify(initialBopomofoData)).filter(item => selectedSymbols.includes(item.symbol));
    onStart(activeData);
  };

  const isAnySelected = Object.values(selection).some(value => value);

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
      <Text style={styles.pageTitle}>選擇要學習的注音</Text>
      <ScrollView contentContainerStyle={styles.selectionGrid}>
        {initialBopomofoData.map(item => (
          <TouchableOpacity 
            key={item.symbol} 
            style={[styles.selectionBox, selection[item.symbol] ? styles.selectedBox : styles.deselectedBox]} 
            onPress={() => toggleSelection(item.symbol)}>
            <Text style={[styles.selectionSymbolText, selection[item.symbol] ? styles.selectedSymbolText : styles.deselectedSymbolText]}>
              {item.symbol}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.controlButtonContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={() => handleSelectAll(true)}>
            <Text style={styles.controlButtonText}>全部選擇</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => handleSelectAll(false)}>
            <Text style={styles.controlButtonText}>全部取消</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.actionButton, isAnySelected ? { backgroundColor: '#10B981' } : styles.disabledButton]} 
        onPress={handleStart}
        disabled={!isAnySelected}>
        <Text style={styles.actionButtonText}>開始學習</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Learning Screen Component ---
const LearningScreen = ({ data, onRegenerate }) => {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [checkedForAi, setCheckedForAi] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const handleCardPress = (item) => {
    if (isEditing) {
        toggleAiCheck(item.symbol);
        return;
    }
    if (selectedSymbol) Speech.stop();
    setSelectedSymbol(item.symbol);
    const toSay = `${item.symbol}, ${item.word}`;
    Speech.speak(toSay, { language: 'zh-TW', onDone: () => setSelectedSymbol(null), onError: () => setSelectedSymbol(null) });
  };

  const toggleAiCheck = (symbol) => {
    setCheckedForAi(prev => ({...prev, [symbol]: !prev[symbol]}));
  };

  const handleSelectAllForEdit = (isSelected) => {
      const newSelection = {};
      data.forEach(item => {
          newSelection[item.symbol] = isSelected;
      });
      setCheckedForAi(newSelection);
  };

  const handleCancel = () => {
      setIsEditing(false);
      setCheckedForAi({});
  };

  const handleSubmit = () => {
    const symbolsToGenerate = Object.keys(checkedForAi).filter(symbol => checkedForAi[symbol]);
    if (symbolsToGenerate.length > 0) {
        onRegenerate(symbolsToGenerate);
    }
    setIsEditing(false);
    setCheckedForAi({});
  };

  const isAnyCheckboxChecked = Object.values(checkedForAi).some(isChecked => isChecked);

  return (
    <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.grid}>
            {data.map((item) => {
                const isCheckedInEditMode = checkedForAi[item.symbol];
                let cardStyle = [styles.card];
                if (isEditing && isCheckedInEditMode) cardStyle.push(styles.editingSelectedCard);
                if (!isEditing && item.symbol === selectedSymbol) cardStyle.push(styles.selectedCard);
                
                return (
                    <TouchableOpacity
                        key={item.symbol}
                        style={cardStyle}
                        onPress={() => handleCardPress(item)}
                        disabled={!isEditing && selectedSymbol !== null}>
                        <View style={styles.cardHeader}>
                           <Text style={[styles.symbolText, isEditing && isCheckedInEditMode && {color: 'white'}]}>{item.symbol}</Text>
                        </View>
                        
                        {!isEditing && (
                            <>
                            <View style={styles.imageContainer}>
                                {item.isLoading ? (
                                    <ActivityIndicator size="large" color="#0A74DA" />
                                ) : item.aiImageUrl ? (
                                    <Image source={{ uri: item.aiImageUrl }} style={styles.aiImage} />
                                ) : (
                                    <Text style={styles.emojiText}>{item.emoji}</Text>
                                )}
                            </View>
                            <Text style={styles.wordText}>{item.word}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
        <View style={styles.bottomBar}>
            {isEditing ? (
                <>
                <View style={styles.controlButtonContainer}>
                    <TouchableOpacity style={styles.controlButton} onPress={() => handleSelectAllForEdit(true)}>
                        <Text style={styles.controlButtonText}>全部選擇</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton} onPress={() => handleSelectAllForEdit(false)}>
                        <Text style={styles.controlButtonText}>全部取消</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.postCheckButtons}>
                    <TouchableOpacity style={[styles.actionButton, styles.secondaryButton, {flex: 1, marginRight: 8}]} onPress={handleCancel}>
                        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionButton, isAnyCheckboxChecked ? styles.enabledButton : styles.disabledButton, {flex: 1, marginLeft: 8}]} 
                        onPress={handleSubmit}
                        disabled={!isAnyCheckboxChecked}>
                        <Text style={styles.actionButtonText}>送出</Text>
                    </TouchableOpacity>
                </View>
                </>
            ) : (
                <TouchableOpacity style={[styles.actionButton, styles.enabledButton]} onPress={() => setIsEditing(true)}>
                    <Text style={styles.actionButtonText}>再生圖像</Text>
                </TouchableOpacity>
            )}
        </View>
    </View>
  );
};

// --- Worksheet Screen Component ---
const WorksheetScreen = ({ data }) => {
    const [worksheetItems, setWorksheetItems] = useState([]);
    const [inputs, setInputs] = useState({});
    const [results, setResults] = useState({});
    const [isChecked, setIsChecked] = useState(false);
    
    const shuffleItems = useCallback(() => {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setWorksheetItems(shuffled.slice(0, Math.min(12, shuffled.length)));
    }, [data]);
    
    useEffect(() => {
        shuffleItems();
    }, [shuffleItems]);

    const handleInputChange = (symbol, value) => {
        setInputs(prev => ({ ...prev, [symbol]: value }));
    };

    const checkAnswers = () => {
        const newResults = {};
        worksheetItems.forEach(item => {
        const userInput = inputs[item.symbol] || '';
        newResults[item.symbol] = userInput === item.symbol ? 'correct' : 'incorrect';
        });
        setResults(newResults);
        setIsChecked(true);
    };
    
    const handlePracticeAgain = () => {
        setInputs({});
        setResults({});
        setIsChecked(false);
        shuffleItems();
    };

    const getInputStyle = (symbol) => {
        if (!isChecked) return styles.worksheetInput;
        const result = results[symbol];
        if (result === 'correct') return [styles.worksheetInput, styles.correctInput];
        if (result === 'incorrect') return [styles.worksheetInput, styles.incorrectInput];
        return styles.worksheetInput;
    };

    const areAllCorrect = isChecked && worksheetItems.length > 0 && 
                          worksheetItems.every(item => results[item.symbol] === 'correct');

    return (
        <View style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.worksheetGrid}>
            {worksheetItems.map((item) => (
            <View key={item.symbol} style={styles.worksheetItem}>
                {item.aiImageUrl ? (
                    <Image source={{ uri: item.aiImageUrl }} style={styles.worksheetImage} />
                ) : (
                    <Text style={styles.worksheetEmoji}>{item.emoji}</Text>
                )}
                <TextInput
                    style={getInputStyle(item.symbol)}
                    maxLength={1}
                    value={inputs[item.symbol] || ''}
                    onChangeText={(text) => handleInputChange(item.symbol, text)}
                    editable={!(isChecked && results[item.symbol] === 'correct')}
                />
            </View>
            ))}
        </ScrollView>
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={[
                    styles.actionButton, 
                    areAllCorrect ? styles.disabledButton : { backgroundColor: '#3B82F6' }
                ]} 
                onPress={checkAnswers}
                disabled={areAllCorrect}>
                <Text style={styles.actionButtonText}>檢查答案</Text>
            </TouchableOpacity>
            {isChecked && (
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#F97316', marginTop: 12 }]} 
                    onPress={handlePracticeAgain}>
                    <Text style={styles.actionButtonText}>再練習一次</Text>
                </TouchableOpacity>
            )}
        </View>
        </View>
    );
};

// --- Main App Component ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('selection');
  const [activeData, setActiveData] = useState([]);
  const [activeTab, setActiveTab] = useState('learning');

  const handleStart = (selectedData) => {
    setActiveData(selectedData);
    setCurrentScreen('main');
  };

  const handleRegenerateAndUpdate = async (symbolsToGenerate) => {
    const updateData = (symbol, updates) => {
        setActiveData(currentData =>
            currentData.map(item =>
                item.symbol === symbol ? { ...item, ...updates } : item
            )
        );
    };

    const generationProcess = async (symbol) => {
        updateData(symbol, { isLoading: true, word: '...' });
        try {
            // --- UPDATED: Word generation with retry logic ---
            let newWord = '';
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                const wordResponse = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: `提供一個兩個字的台灣繁體中文單字是${symbol}開頭的，給我字就好了` }],
                        temperature: 0.8, // Increased creativity slightly
                        max_tokens: 20,
                    },
                    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` } }
                );
            
                const fullResponse = wordResponse.data.choices[0].message.content;
                const matches = fullResponse.match(/[\u4e00-\u9fa5]+/);
                const potentialWord = matches ? matches[0] : '';

                if (potentialWord.length === 2) {
                    newWord = potentialWord;
                    break; // Exit loop if we get a valid 2-character word
                }
                attempts++; // Increment attempts and retry
            }
            
            if (!newWord) {
                throw new Error(`Failed to generate a valid 2-character word after ${maxAttempts} attempts.`);
            }

            // --- End of new logic ---

            const imageResponse = await axios.post(
                'https://api.openai.com/v1/images/generations',
                { model: 'dall-e-3', prompt: `A cute, simple cartoon of ${newWord}`, n: 1, size: '1024x1024' },
                { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` } }
            );
            const newImageUrl = imageResponse.data.data[0].url;
            updateData(symbol, { word: newWord, aiImageUrl: newImageUrl, isLoading: false });

        } catch (error) {
            console.error(`Error regenerating for ${symbol}:`, error);
            const originalItem = initialBopomofoData.find(item => item.symbol === symbol);
            updateData(symbol, { ...originalItem, isLoading: false });
        }
    };
    
    await Promise.all(symbolsToGenerate.map(symbol => generationProcess(symbol)));
  };
  
  const MainApp = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>注音符號學習樂園</Text>
        <TouchableOpacity onPress={() => setCurrentScreen('selection')} style={styles.homeButton}>
             <Ionicons name="home-outline" size={30} color="#0A74DA" />
        </TouchableOpacity>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'learning' && styles.activeTab]}
          onPress={() => setActiveTab('learning')}>
          <Text style={[styles.tabText, activeTab === 'learning' && styles.activeTabText]}>學習</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'worksheet' && styles.activeTab]}
          onPress={() => setActiveTab('worksheet')}>
          <Text style={[styles.tabText, activeTab === 'worksheet' && styles.activeTabText]}>練習</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {activeTab === 'learning' ? (
            <LearningScreen data={activeData} onRegenerate={handleRegenerateAndUpdate} />
        ) : (
            <WorksheetScreen data={activeData} />
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'selection' ? <SelectionScreen onStart={handleStart} /> : <MainApp />}
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const { width } = Dimensions.get('window');
const cardSize = (width - 24 * 2 - 16 * 2) / 3; 
const worksheetItemSize = (width - 24 * 2 - 16) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    flexDirection: 'row', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0A74DA' },
  homeButton: { 
    position: 'absolute', right: 20, top: 0, bottom: 0, justifyContent: 'center'
  },
  tabContainer: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', paddingVertical: 10,
  },
  tabButton: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  activeTab: { backgroundColor: '#0A74DA' },
  tabText: { fontSize: 18, fontWeight: '500', color: '#4A5568' },
  activeTabText: { color: '#FFFFFF' },
  content: { flex: 1, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingHorizontal: 8 },
  card: {
    width: cardSize, height: cardSize * 1.4, backgroundColor: 'white', borderRadius: 12, padding: 10, margin: 8,
    alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  selectedCard: { backgroundColor: '#FACC15', transform: [{ scale: 1.05 }] },
  editingSelectedCard: { backgroundColor: '#60A5FA', borderColor: '#2563EB', borderWidth: 2 },
  symbolText: { fontSize: 32, fontWeight: 'bold', color: '#1E293B' },
  imageContainer: {
    width: cardSize * 0.6, height: cardSize * 0.6, alignItems: 'center', justifyContent: 'center',
  },
  emojiText: { fontSize: 40 },
  aiImage: { width: '100%', height: '100%', borderRadius: 8 },
  wordText: { fontSize: 18, color: '#475569', minHeight: 22 },
  worksheetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingBottom: 20 },
  worksheetItem: { width: worksheetItemSize, alignItems: 'center', marginBottom: 24 },
  worksheetEmoji: { fontSize: 70, lineHeight: 80 },
  worksheetImage: {
    width: 80, height: 80, borderRadius: 10,
  },
  worksheetInput: {
    marginTop: 12, width: 60, height: 60, borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 10,
    textAlign: 'center', fontSize: 32, fontWeight: 'bold', color: '#1E293B',
  },
  correctInput: { borderColor: '#10B981', borderWidth: 3 },
  incorrectInput: { borderColor: '#EF4444', borderWidth: 3 },
  bottomBar: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  buttonContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  actionButton: {
    paddingVertical: 15, borderRadius: 25, alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  enabledButton: { backgroundColor: '#0A74DA' },
  disabledButton: { backgroundColor: '#9E9E9E' },
  actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  postCheckButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#F97316' },
  secondaryButtonText: { color: '#F97316' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1E293B' },
  selectionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 20,
  },
  selectionBox: {
    width: 70, height: 70, margin: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  selectedBox: { backgroundColor: '#E0F2FE', borderColor: '#0A74DA' },
  deselectedBox: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  selectionSymbolText: { fontSize: 32, fontWeight: 'bold' },
  selectedSymbolText: { color: '#0A74DA' },
  deselectedSymbolText: { color: '#4A5568' },
  controlButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      marginBottom: 20,
  },
  controlButton: {
      paddingVertical: 10,
      paddingHorizontal: 25,
      backgroundColor: '#E2E8F0',
      borderRadius: 20,
  },
  controlButtonText: {
      fontSize: 16,
      color: '#4A5568',
      fontWeight: '500',
  }
});