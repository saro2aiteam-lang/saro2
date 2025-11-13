"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface BlogPostContentProps {
  content: string;
}

const BlogPostContent = ({ content }: BlogPostContentProps) => {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-[680px] mx-auto 
      prose-headings:font-sans prose-headings:tracking-tight prose-headings:scroll-mt-20 
      prose-h1:text-[42px] prose-h1:mb-6 prose-h1:mt-12 prose-h1:leading-[1.2] prose-h1:font-bold prose-h1:text-gray-900 dark:prose-h1:text-gray-100 prose-h1:tracking-[-0.02em]
      prose-h2:text-[32px] prose-h2:mb-5 prose-h2:mt-10 prose-h2:font-semibold prose-h2:text-gray-900 dark:prose-h2:text-gray-100 prose-h2:tracking-[-0.01em] prose-h2:leading-[1.3] prose-h2:border-none prose-h2:pb-0
      prose-h3:text-[24px] prose-h3:mb-4 prose-h3:mt-8 prose-h3:font-semibold prose-h3:text-gray-900 dark:prose-h3:text-gray-100 prose-h3:tracking-normal prose-h3:leading-[1.4]
      prose-p:text-[21px] prose-p:leading-[1.58] prose-p:mb-7 prose-p:mt-0 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:font-sans prose-p:tracking-normal
      prose-ul:my-7 prose-ul:space-y-2 prose-ol:my-7 prose-ol:space-y-2 
      prose-li:text-[21px] prose-li:leading-[1.58] prose-li:mb-2 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-li:font-sans prose-li:marker:text-gray-500 prose-li:pl-2
      prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold 
      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-normal prose-a:no-underline prose-a:bg-transparent prose-a:px-0 prose-a:py-0 prose-a:rounded-none prose-a:border-none hover:prose-a:underline hover:prose-a:bg-transparent hover:prose-a:border-none hover:prose-a:shadow-none prose-a:transition-colors prose-a:duration-200 prose-a:inline prose-a:mx-0 
      prose-code:text-[18px] prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono 
      prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:text-[16px] prose-pre:leading-[1.6]
      prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-[21px] prose-blockquote:leading-[1.58] prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-blockquote:bg-transparent prose-blockquote:rounded-none prose-blockquote:my-7
      prose-img:rounded-lg prose-img:shadow-md prose-img:my-8 prose-img:w-full prose-img:h-auto 
      prose-hr:border-t prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-hr:my-8 
      prose-table:text-[18px] prose-table:border-collapse prose-table:w-full prose-table:my-7 
      prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:px-4 prose-th:py-3 prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-th:font-semibold prose-th:text-gray-900 dark:prose-th:text-gray-100 prose-th:text-[18px]
      prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-4 prose-td:py-3 prose-td:text-gray-800 dark:prose-td:text-gray-200 prose-td:text-[18px]
      [&>*:first-child]:mt-0 
      [&_iframe]:w-full [&_iframe]:h-[400px] [&_iframe]:rounded-lg [&_iframe]:shadow-md [&_iframe]:my-8 [&_iframe]:border [&_iframe]:border-gray-200 [&_iframe]:dark:border-gray-700">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default BlogPostContent;
