"""PDF文本提取工具"""
import logging
from pathlib import Path
from typing import Optional
import io

logger = logging.getLogger(__name__)

class PDFExtractor:
    """PDF文本提取器"""
    
    def __init__(self):
        self._check_dependencies()
    
    def _check_dependencies(self):
        """检查依赖库是否安装"""
        try:
            import PyPDF2
            self.use_pypdf2 = True
        except ImportError:
            try:
                import pdfplumber
                self.use_pdfplumber = True
            except ImportError:
                logger.warning("未安装PDF处理库，请安装 PyPDF2 或 pdfplumber")
                self.use_pypdf2 = False
                self.use_pdfplumber = False
    
    def extract_text(self, pdf_path: Path, max_pages: Optional[int] = None) -> Optional[str]:
        """
        从PDF文件中提取文本
        
        Args:
            pdf_path: PDF文件路径
            max_pages: 最大提取页数（None表示提取所有页面）
        
        Returns:
            提取的文本内容，如果失败返回None
        """
        if not pdf_path.exists():
            logger.error(f"PDF文件不存在: {pdf_path}")
            return None
        
        try:
            # 优先使用pdfplumber（更准确）
            if hasattr(self, 'use_pdfplumber') and self.use_pdfplumber:
                return self._extract_with_pdfplumber(pdf_path, max_pages)
            # 其次使用PyPDF2
            elif hasattr(self, 'use_pypdf2') and self.use_pypdf2:
                return self._extract_with_pypdf2(pdf_path, max_pages)
            else:
                logger.error("未安装PDF处理库")
                return None
        except Exception as e:
            logger.error(f"提取PDF文本失败: {e}")
            return None
    
    def extract_text_from_bytes(self, pdf_bytes: bytes, max_pages: Optional[int] = None) -> Optional[str]:
        """
        从PDF字节数据中提取文本
        
        Args:
            pdf_bytes: PDF文件的字节数据
            max_pages: 最大提取页数（None表示提取所有页面）
        
        Returns:
            提取的文本内容，如果失败返回None
        """
        try:
            # 优先使用pdfplumber（更准确）
            if hasattr(self, 'use_pdfplumber') and self.use_pdfplumber:
                return self._extract_with_pdfplumber_bytes(pdf_bytes, max_pages)
            # 其次使用PyPDF2
            elif hasattr(self, 'use_pypdf2') and self.use_pypdf2:
                return self._extract_with_pypdf2_bytes(pdf_bytes, max_pages)
            else:
                logger.error("未安装PDF处理库")
                return None
        except Exception as e:
            logger.error(f"提取PDF文本失败: {e}")
            return None
    
    def _extract_with_pdfplumber(self, pdf_path: Path, max_pages: Optional[int] = None) -> str:
        """使用pdfplumber提取文本"""
        import pdfplumber
        
        text_parts = []
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            pages_to_extract = min(total_pages, max_pages) if max_pages else total_pages
            
            for i in range(pages_to_extract):
                page = pdf.pages[i]
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        
        return "\n\n".join(text_parts)
    
    def _extract_with_pdfplumber_bytes(self, pdf_bytes: bytes, max_pages: Optional[int] = None) -> str:
        """使用pdfplumber从字节数据提取文本"""
        import pdfplumber
        
        text_parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            total_pages = len(pdf.pages)
            pages_to_extract = min(total_pages, max_pages) if max_pages else total_pages
            
            for i in range(pages_to_extract):
                page = pdf.pages[i]
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        
        return "\n\n".join(text_parts)
    
    def _extract_with_pypdf2(self, pdf_path: Path, max_pages: Optional[int] = None) -> str:
        """使用PyPDF2提取文本"""
        import PyPDF2
        
        text_parts = []
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)
            pages_to_extract = min(total_pages, max_pages) if max_pages else total_pages
            
            for i in range(pages_to_extract):
                page = pdf_reader.pages[i]
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        
        return "\n\n".join(text_parts)
    
    def _extract_with_pypdf2_bytes(self, pdf_bytes: bytes, max_pages: Optional[int] = None) -> str:
        """使用PyPDF2从字节数据提取文本"""
        import PyPDF2
        
        text_parts = []
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(pdf_reader.pages)
        pages_to_extract = min(total_pages, max_pages) if max_pages else total_pages
        
        for i in range(pages_to_extract):
            page = pdf_reader.pages[i]
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        return "\n\n".join(text_parts)

# 创建全局提取器实例
pdf_extractor = PDFExtractor()







