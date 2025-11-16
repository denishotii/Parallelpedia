import axios from 'axios';
import type { Article, TopicAnalysis, CommunityNote } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getGrokArticle = async (topicId: string): Promise<Article> => {
  const response = await api.get(`/api/topics/${topicId}/grok`);
  return response.data;
};

export const getWikipediaArticle = async (topicId: string): Promise<Article> => {
  const response = await api.get(`/api/topics/${topicId}/wikipedia`);
  return response.data;
};

export const compareTopic = async (topicId: string): Promise<TopicAnalysis> => {
  const response = await api.post(`/api/topics/${topicId}/compare`);
  return response.data;
};

export const publishCommunityNote = async (topicId: string): Promise<{ success: boolean; asset_id: string; community_note: CommunityNote }> => {
  const response = await api.post(`/api/topics/${topicId}/community-note`);
  return response.data;
};

export const getCommunityNote = async (topicId: string): Promise<CommunityNote> => {
  const response = await api.get(`/api/topics/${topicId}/community-note`);
  return response.data;
};

