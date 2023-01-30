#include "utils.h"

std::vector<std::string> StringSplit(const std::string& str, const std::string& pattern)
{
	std::string::size_type pos;
	std::vector<std::string> result;
	std::string _str(str);
	_str += pattern;//��չ�ַ����Է������
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




// std::string StringFormat(const char* lpcszFormat, ...)
// {
// 	std::string strResult;
// 	if (NULL != lpcszFormat)
// 	{
// 		va_list marker = {};
// 		va_start(marker, lpcszFormat); //��ʼ����������
// 		size_t nLength = vsnprintf(lpcszFormat, marker) + 1; //��ȡ��ʽ���ַ�������
// 		std::vector<char> vBuffer(nLength, '\0'); //�������ڴ洢��ʽ���ַ������ַ�����
// 		int nWritten = vsnprintf(&vBuffer[0], nLength, lpcszFormat, marker);
// 		if (nWritten > 0)
// 		{
// 			strResult = &vBuffer[0];
// 		}
// 		va_end(marker); //���ñ�������
// 	}
// 	return strResult;
// }