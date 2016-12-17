class ObjectParamsParser
{
    const PARAMS_OPENER = '{';
    const PARAMS_CLOSER = '}';
    const PARAMS_SEPARATOR = ';';
    const PARAMS_EQUAL = '=';

    /**
     * Parses the params from a field string, where the params are in the format: {param1=value1;param2=value2}
     * @param string $field
     * @return array
     */
    public function parse($field)
    {
        $params = [];
        $resultParams = [];
        $hasParams = preg_match("/" . self::PARAMS_OPENER . ".*?" . self::PARAMS_CLOSER . "/", $field, $params);
        if ($hasParams) {
            $keysAllowed = "(\w*?)";
            $valuesAllowed = "([^" . self::PARAMS_SEPARATOR . self::PARAMS_CLOSER . "]*)";
            $matchesRegex = "/" . $keysAllowed . self::PARAMS_EQUAL . $valuesAllowed . "/";

            $matches = [];
            $foundMatches = preg_match_all($matchesRegex, $params[0], $matches);
            if ($foundMatches) {
                $length = count($matches[0]);
                for ($i = 0; $i < $length; $i++) {
                    $key = $matches[1][$i];
                    $value = $matches[2][$i];
                    // values must be passed encoded, so we can use comas and other url characters
                    $resultParams[$key] = urldecode($value);
                }
            }
        }
        return $resultParams;
    }
}

// SPEC:
class ObjectParamsParserTest extends PHPUnit_Framework_Assert
{
    /**
     * @return array
     */
    public function dataProviderParse()
    {
        $complexString = "a complex & strange, string. ;a=b, huh?";

        return [
            "empty value"                    => ["", []],
            "no params"                      => ["site.id", []],
            "has empty params"               => ["site.id{}", []],
            "has one param"                  => ["site.id{one=param}", ["one" => "param"]],
            "has several params"             => ["site.id{first=param;another=try;and=last}", ["first" => "param", "another" => "try", "and" => "last"]],
            "encoded params"                 => ["site.id{one=" . urlencode($complexString) . "}" , ["one" => $complexString]],
            "invalid params - no opener"     => ["site.idone=param}", []],
            "invalid params - no closer"     => ["site.id{one=param", []],
            "invalid params - no equal sign" => ["site.id{oneparam}", []],
        ];
    }

    /**
     * @dataProvider dataProviderParse
     * @covers       \ObjectParamsParser::parse
     *
     * @param string $value
     * @param array $expectedParamsArray
     */
    public function testParse($value, array $expectedParamsArray)
    {
        $objectParamsParser = new \ObjectParamsParser();
        $paramsArray = $objectParamsParser->parse($value);
        $this->assertEquals($expectedParamsArray, $paramsArray, "Params array");
    }
}
