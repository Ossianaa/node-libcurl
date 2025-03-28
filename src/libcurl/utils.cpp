#include "utils.h"

std::vector<std::string> StringSplit(const std::string& str, const std::string& pattern)
{
	std::string::size_type pos;
	std::vector<std::string> result;
	std::string _str(str);
	_str += pattern;
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