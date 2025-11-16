import React from 'react';
import { Article } from '../types';

interface ArticleViewProps {
  article: Article;
  title: string;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, title }) => {
  return (
    <div className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto max-h-[600px]">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm mb-4 inline-block"
        >
          View source →
        </a>
      )}
      <div className="prose prose-sm max-w-none">
        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {article.raw_text}
        </p>
      </div>
    </div>
  );
};

