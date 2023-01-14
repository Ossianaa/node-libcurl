#include "utils.h"

std::vector<std::string> StringSplit(const std::string& str, const std::string& pattern)
{
	std::string::size_type pos;
	std::vector<std::string> result;
	std::string _str(str);
	_str += pattern;//扩展字符串以方便操作
	size_t size = _str.size();
	for (size_t i = 0; i < size; i++)
	{
		pos = _str.find(pattern, i);
		if (pos < size)
		{
			std::string s = _str.substr(i, pos - i);
			result.push_back(s);
			i = pos + pattern.size() - 1;
		}
	}
	return result;
}


std::string StringFormat(const char* lpcszFormat, ...)
{
	std::string strResult;
	if (NULL != lpcszFormat)
	{
		va_list marker = NULL;
		va_start(marker, lpcszFormat); //初始化变量参数
		size_t nLength = _vscprintf(lpcszFormat, marker) + 1; //获取格式化字符串长度
		std::vector<char> vBuffer(nLength, '\0'); //创建用于存储格式化字符串的字符数组
		int nWritten = _vsnprintf_s(&vBuffer[0], vBuffer.size(), nLength, lpcszFormat, marker);
		if (nWritten > 0)
		{
			strResult = &vBuffer[0];
		}
		va_end(marker); //重置变量参数
	}
	return strResult;
}