"""
LibreOffice文档转换工具
使用LibreOffice命令行工具将Office文档转换为PDF
"""
import subprocess
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

class LibreOfficeConverter:
    """LibreOffice文档转换器"""
    
    def __init__(self, libreoffice_path: Optional[str] = None):
        """
        初始化转换器
        
        Args:
            libreoffice_path: LibreOffice可执行文件路径，如果为None则自动检测
        """
        if libreoffice_path:
            self.libreoffice_path = libreoffice_path
        else:
            # 尝试多个可能的路径
            possible_paths = [
                "libreoffice",  # 系统PATH中
                "/Applications/LibreOffice.app/Contents/MacOS/soffice",  # macOS Homebrew安装
                "/usr/bin/libreoffice",  # Linux标准路径
                "/usr/local/bin/libreoffice",  # Linux本地安装
            ]
            
            self.libreoffice_path = None
            for path in possible_paths:
                try:
                    result = subprocess.run(
                        [path, "--version"],
                        capture_output=True,
                        timeout=5
                    )
                    if result.returncode == 0:
                        self.libreoffice_path = path
                        break
                except:
                    continue
            
            if not self.libreoffice_path:
                self.libreoffice_path = "libreoffice"  # 默认值
        
        self._check_libreoffice()
    
    def _check_libreoffice(self) -> bool:
        """检查LibreOffice是否可用"""
        try:
            result = subprocess.run(
                [self.libreoffice_path, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                logger.info(f"LibreOffice可用: {result.stdout.strip()}")
                return True
            else:
                logger.warning(f"LibreOffice检查失败: {result.stderr}")
                return False
        except FileNotFoundError:
            logger.warning(f"LibreOffice未找到，请确保已安装LibreOffice")
            return False
        except Exception as e:
            logger.error(f"检查LibreOffice时出错: {e}")
            return False
    
    def convert_to_pdf(
        self, 
        input_file: Path, 
        output_dir: Path,
        timeout: int = 60
    ) -> Optional[Path]:
        """
        将文档转换为PDF
        
        Args:
            input_file: 输入文件路径
            output_dir: 输出目录路径
            timeout: 转换超时时间（秒）
        
        Returns:
            PDF文件路径，如果转换失败返回None
        """
        if not input_file.exists():
            logger.error(f"输入文件不存在: {input_file}")
            return None
        
        # 确保输出目录存在
        output_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # 使用绝对路径，避免路径问题
            input_file_abs = input_file.resolve()
            output_dir_abs = output_dir.resolve()
            
            # LibreOffice命令行格式:
            # libreoffice --headless --convert-to pdf --outdir <output_dir> <input_file>
            cmd = [
                self.libreoffice_path,
                "--headless",  # 无界面模式
                "--convert-to", "pdf",  # 转换为PDF
                "--outdir", str(output_dir_abs),  # 输出目录（绝对路径）
                str(input_file_abs)  # 输入文件（绝对路径）
            ]
            
            logger.info(f"开始转换文档: {input_file_abs} -> PDF")
            logger.debug(f"执行命令: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            if result.returncode != 0:
                logger.error(f"LibreOffice转换失败，返回码: {result.returncode}")
                logger.error(f"标准输出: {result.stdout}")
                logger.error(f"标准错误: {result.stderr}")
                return None
            
            # LibreOffice会在输出目录生成PDF文件，文件名与输入文件相同但扩展名为.pdf
            input_stem = input_file.stem
            pdf_file = output_dir_abs / f"{input_stem}.pdf"
            
            # 等待一下，确保文件写入完成
            import time
            time.sleep(0.5)
            
            if pdf_file.exists():
                logger.info(f"PDF转换成功: {pdf_file}")
                return pdf_file
            else:
                logger.error(f"PDF文件未生成: {pdf_file}")
                logger.error(f"输出目录内容: {list(output_dir_abs.iterdir())}")
                return None
                
        except subprocess.TimeoutExpired:
            logger.error(f"转换超时（{timeout}秒）: {input_file}")
            return None
        except Exception as e:
            logger.error(f"转换过程中出错: {e}")
            return None
    
    def is_supported_format(self, file_path: Path) -> bool:
        """
        检查文件格式是否支持转换
        
        Args:
            file_path: 文件路径
        
        Returns:
            是否支持转换
        """
        supported_extensions = {
            '.doc', '.docx',  # Word
            '.xls', '.xlsx',  # Excel
            '.ppt', '.pptx',  # PowerPoint
            '.odt', '.ods', '.odp',  # OpenDocument格式
            '.rtf',  # Rich Text Format
        }
        return file_path.suffix.lower() in supported_extensions

# 创建全局转换器实例
libreoffice_converter = LibreOfficeConverter()

