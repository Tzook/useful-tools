class FieldsParamsParser
{
    /**
     * Gets an array param with nestings.
     * @example "a.b.(c,d)" will return ["a.b.c", "a.b.d"]
     * @param string $param
     * @param string $open
     * @param string $close
     * @param string $delimiter
     * @param array $defaultValue
     * @return array
     */
    public function parse($param, $open = '\(', $close = '\)', $delimiter = ',', $defaultValue = [])
    {
        if (empty($param)) {
            return $defaultValue;
        }

        $validStart = "(?<![^{$delimiter}{$open}])";
        $prefix = "([^{$delimiter}{$open}{$close}]*)";
        $dataToExplode = "{$open}([^{$open}{$close}]+){$close}";
        $noNestsAhead = "(?!.*{$open}[^{$close}]*{$open})"; // make sure you go on the deepest levels first
        $suffix = "((?:[^{$delimiter}{$close}{$open}]|{$open}.*?{$close})*)";

        $pattern = "/{$validStart}{$prefix}{$dataToExplode}{$noNestsAhead}{$suffix}/";
        // as long as we found matches, continue
        while (preg_match($pattern, $param)) {
            $param = preg_replace_callback($pattern, function ($matches) use ($delimiter) {
                $dataArray = explode($delimiter, $matches[2]);
                $prefixMatch = $matches[1];
                $suffixMatch = $matches[3];
                $resultArray = [];
                // loop on each inner field and concat it to the outer field, i.e "a.(b,c)" becomes "a.b,a.c"
                foreach ($dataArray as $data) {
                    $resultArray[] = "{$prefixMatch}{$data}{$suffixMatch}";
                }
                // glue results back with the delimiter
                $result = implode($delimiter, $resultArray);
                return $result;
            }, $param);
        }
        // split all params to an array
        $paramValue = explode(',', $param);

        return $paramValue;
    }
}


// SPEC:
class FieldsParamsParserTest extends PHPUnit_Framework_TestCase
{
    /**
     * @return array
     */
    public function dataProviderParse()
    {
        return [
            "params null"                    => [null, []],
            "params empty"                   => ["", []],
            "valid params exist"             => ["ab_test_ppc", ["ab_test_ppc"]],
            "more than one valid item"       => ["ab_test_ppc,ab_test_dna", ["ab_test_ppc", "ab_test_dna"]],
            "valid without brackets"         => ["a.b.c,d.e,f.g.*", ["a.b.c", "d.e", "f.g.*"]],
            "valid with brackets"            => ["a.b.(c,d),h.i", ["a.b.c", "a.b.d", "h.i"]],
            "valid with after brackets"      => ["a.(b,c).d.(e,f).(g,h)", ["a.b.d.e.g", "a.b.d.e.h", "a.b.d.f.g", "a.b.d.f.h", "a.c.d.e.g", "a.c.d.e.h", "a.c.d.f.g", "a.c.d.f.h"]],
            "valid with nested brackets"     => ["a.b.(c,d,e.(f,g)).x.(y,z),h.i,j.(k,l,m).(n,o.(p,q),(r,s).t)", ["a.b.c.x.y", "a.b.c.x.z", "a.b.d.x.y", "a.b.d.x.z", "a.b.e.f.x.y", "a.b.e.f.x.z", "a.b.e.g.x.y", "a.b.e.g.x.z", "h.i", "j.k.n", "j.k.o.p", "j.k.o.q", "j.k.r.t", "j.k.s.t", "j.l.n", "j.l.o.p", "j.l.o.q", "j.l.r.t", "j.l.s.t", "j.m.n", "j.m.o.p", "j.m.o.q", "j.m.r.t", "j.m.s.t"]],
            "field with params and brackets" => ["a.b{c=d;e=f}.(f,g).h,i.j", ["a.b{c=d;e=f}.f.h", "a.b{c=d;e=f}.g.h", "i.j"]],
        ];
    }

    /**
     * @dataProvider dataProviderParse
     * @covers       \FieldsParamsParser::parse
     *
     * @param array|null $value
     * @param array $expectedResult
     */
    public function testParse($value, $expectedResult)
    {
        $fieldsParamsParser = new \FieldsParamsParser();
        $result = $fieldsParamsParser->parse($value);
        $this->assertEquals($expectedResult, $result);
    }
}
