import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  moveis: '@casanova:moveis',
  presentes: '@casanova:presentes',
  orcamento: '@casanova:orcamento',
};

export const getMoveis = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.moveis);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveMoveis = async (lista) => {
  await AsyncStorage.setItem(KEYS.moveis, JSON.stringify(lista));
};

export const getPresentes = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.presentes);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePresentes = async (lista) => {
  await AsyncStorage.setItem(KEYS.presentes, JSON.stringify(lista));
};

export const getOrcamento = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.orcamento);
    return data ? JSON.parse(data) : { total: 0 };
  } catch {
    return { total: 0 };
  }
};

export const saveOrcamento = async (orcamento) => {
  await AsyncStorage.setItem(KEYS.orcamento, JSON.stringify(orcamento));
};
