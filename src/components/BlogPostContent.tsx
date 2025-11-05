"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface BlogPostContentProps {
  content: string;
}

const BlogPostContent = ({ content }: BlogPostContentProps) => {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none mx-auto 
      prose-headings:font-sans prose-headings:tracking-normal prose-headings:scroll-mt-20 
      prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:leading-tight prose-h1:font-normal prose-h1:text-gray-900 dark:prose-h1:text-gray-100 
      prose-h2:text-2xl prose-h2:mb-6 prose-h2:mt-8 prose-h2:font-normal prose-h2:text-gray-900 dark:prose-h2:text-gray-100 prose-h2:tracking-normal prose-h2:border-none prose-h2:pb-0 prose-h2:leading-[1.5] 
      prose-h3:text-xl prose-h3:mb-6 prose-h3:mt-6 prose-h3:font-normal prose-h3:text-gray-900 dark:prose-h3:text-gray-100 prose-h3:tracking-normal prose-h3:leading-[1.5] 
      prose-p:text-base prose-p:leading-[1.6] prose-p:mb-4 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:font-sans prose-p:tracking-normal
      prose-ul:my-4 prose-ul:space-y-2 prose-ol:my-4 prose-ol:space-y-2 
      prose-li:text-base prose-li:leading-[1.6] prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:font-sans prose-li:marker:text-gray-400 
      prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-medium 
      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-normal prose-a:no-underline prose-a:bg-transparent prose-a:px-0 prose-a:py-0 prose-a:rounded-none prose-a:border-none hover:prose-a:bg-transparent hover:prose-a:border-none hover:prose-a:shadow-none prose-a:transition-none prose-a:duration-0 prose-a:inline prose-a:mx-0 
      prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm 
      prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-pre:rounded-lg 
      prose-blockquote:border-l-2 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:bg-transparent prose-blockquote:rounded-none 
      prose-img:rounded-none prose-img:shadow-none prose-img:my-6 prose-img:w-full prose-img:h-auto 
      prose-hr:border-t prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-hr:my-6 
      prose-table:text-sm prose-table:border-collapse prose-table:w-full prose-table:my-6 
      prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:px-3 prose-th:py-2 prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-th:font-medium prose-th:text-gray-900 dark:prose-th:text-gray-100 
      prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-3 prose-td:py-2 prose-td:text-gray-700 dark:prose-td:text-gray-300 
      [&>*:first-child]:mt-0 
      [&_iframe]:w-full [&_iframe]:h-[400px] [&_iframe]:rounded-lg [&_iframe]:shadow-sm [&_iframe]:my-6 [&_iframe]:border [&_iframe]:border-gray-200 [&_iframe]:dark:border-gray-700">
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
