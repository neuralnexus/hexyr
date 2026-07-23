import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';

const Asn1ViewerPage = lazy(() =>
  import('../features/asn1/Asn1ViewerPage').then((module) => ({
    default: module.Asn1ViewerPage,
  })),
);
const AsciiArtPage = lazy(() =>
  import('../features/ascii/AsciiArtPage').then((module) => ({ default: module.AsciiArtPage })),
);
const Base64Page = lazy(() =>
  import('../features/base64/Base64Page').then((module) => ({ default: module.Base64Page })),
);
const BatchTransformPage = lazy(() =>
  import('../features/batch/BatchTransformPage').then((module) => ({
    default: module.BatchTransformPage,
  })),
);
const BinaryPage = lazy(() =>
  import('../features/binary/BinaryPage').then((module) => ({ default: module.BinaryPage })),
);
const BitwisePage = lazy(() =>
  import('../features/bitwise/BitwisePage').then((module) => ({ default: module.BitwisePage })),
);
const ByteInspectorPage = lazy(() =>
  import('../features/bytes/ByteInspectorPage').then((module) => ({
    default: module.ByteInspectorPage,
  })),
);
const CertInspectorPage = lazy(() =>
  import('../features/cert/CertInspectorPage').then((module) => ({
    default: module.CertInspectorPage,
  })),
);
const CompressionPage = lazy(() =>
  import('../features/compress/CompressionPage').then((module) => ({
    default: module.CompressionPage,
  })),
);
const CookieAnalyzerPage = lazy(() =>
  import('../features/cookies/CookieAnalyzerPage').then((module) => ({
    default: module.CookieAnalyzerPage,
  })),
);
const DnsToolkitPage = lazy(() =>
  import('../features/dns/DnsToolkitPage').then((module) => ({ default: module.DnsToolkitPage })),
);
const DiffPage = lazy(() =>
  import('../features/diff/DiffPage').then((module) => ({ default: module.DiffPage })),
);
const JsonYamlFormatterPage = lazy(() =>
  import('../features/formatter/JsonYamlFormatterPage').then((module) => ({
    default: module.JsonYamlFormatterPage,
  })),
);
const HashPage = lazy(() =>
  import('../features/hash/HashPage').then((module) => ({ default: module.HashPage })),
);
const HarInspectorPage = lazy(() =>
  import('../features/har/HarInspectorPage').then((module) => ({
    default: module.HarInspectorPage,
  })),
);
const HexPage = lazy(() =>
  import('../features/hex/HexPage').then((module) => ({ default: module.HexPage })),
);
const HexdumpPage = lazy(() =>
  import('../features/hexdump/HexdumpPage').then((module) => ({ default: module.HexdumpPage })),
);
const HtmlPage = lazy(() =>
  import('../features/html/HtmlPage').then((module) => ({ default: module.HtmlPage })),
);
const IdUtilityPage = lazy(() =>
  import('../features/ids/IdUtilityPage').then((module) => ({ default: module.IdUtilityPage })),
);
const InspectorPage = lazy(() =>
  import('../features/inspector/InspectorPage').then((module) => ({
    default: module.InspectorPage,
  })),
);
const JwtPage = lazy(() =>
  import('../features/jwt/JwtPage').then((module) => ({ default: module.JwtPage })),
);
const PcapLitePage = lazy(() =>
  import('../features/pcap/PcapLitePage').then((module) => ({ default: module.PcapLitePage })),
);
const PolicyLinterPage = lazy(() =>
  import('../features/policy/PolicyLinterPage').then((module) => ({
    default: module.PolicyLinterPage,
  })),
);
const QueryPlaygroundPage = lazy(() =>
  import('../features/query/QueryPlaygroundPage').then((module) => ({
    default: module.QueryPlaygroundPage,
  })),
);
const RedactionPage = lazy(() =>
  import('../features/redact/RedactionPage').then((module) => ({ default: module.RedactionPage })),
);
const HttpReplayPage = lazy(() =>
  import('../features/replay/HttpReplayPage').then((module) => ({
    default: module.HttpReplayPage,
  })),
);
const RegexExtractorPage = lazy(() =>
  import('../features/regex/RegexExtractorPage').then((module) => ({
    default: module.RegexExtractorPage,
  })),
);
const SchemaValidatorPage = lazy(() =>
  import('../features/schema/SchemaValidatorPage').then((module) => ({
    default: module.SchemaValidatorPage,
  })),
);
const HttpSignerPage = lazy(() =>
  import('../features/signer/HttpSignerPage').then((module) => ({
    default: module.HttpSignerPage,
  })),
);
const TimezoneLabPage = lazy(() =>
  import('../features/timezone/TimezoneLabPage').then((module) => ({
    default: module.TimezoneLabPage,
  })),
);
const TlsVerifierPage = lazy(() =>
  import('../features/tls/TlsVerifierPage').then((module) => ({
    default: module.TlsVerifierPage,
  })),
);
const UnicodePage = lazy(() =>
  import('../features/unicode/UnicodePage').then((module) => ({ default: module.UnicodePage })),
);
const UrlPage = lazy(() =>
  import('../features/url/UrlPage').then((module) => ({ default: module.UrlPage })),
);
const WebhookVerifierPage = lazy(() =>
  import('../features/webhook/WebhookVerifierPage').then((module) => ({
    default: module.WebhookVerifierPage,
  })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/inspect" replace />} />
        <Route path="/inspect" element={<InspectorPage />} />
        <Route path="/tool/hex" element={<HexPage />} />
        <Route path="/tool/base64" element={<Base64Page />} />
        <Route path="/tool/binary" element={<BinaryPage />} />
        <Route path="/tool/url" element={<UrlPage />} />
        <Route path="/tool/html" element={<HtmlPage />} />
        <Route path="/tool/unicode" element={<UnicodePage />} />
        <Route path="/tool/jwt" element={<JwtPage />} />
        <Route path="/tool/hash" element={<HashPage />} />
        <Route path="/tool/bitwise" element={<BitwisePage />} />
        <Route path="/tool/hexdump" element={<HexdumpPage />} />
        <Route path="/tool/cert" element={<CertInspectorPage />} />
        <Route path="/tool/query" element={<QueryPlaygroundPage />} />
        <Route path="/tool/bytes" element={<ByteInspectorPage />} />
        <Route path="/tool/signer" element={<HttpSignerPage />} />
        <Route path="/tool/diff" element={<DiffPage />} />
        <Route path="/tool/pcap" element={<PcapLitePage />} />
        <Route path="/tool/tls" element={<TlsVerifierPage />} />
        <Route path="/tool/redact" element={<RedactionPage />} />
        <Route path="/tool/compress" element={<CompressionPage />} />
        <Route path="/tool/asn1" element={<Asn1ViewerPage />} />
        <Route path="/tool/replay" element={<HttpReplayPage />} />
        <Route path="/tool/regex" element={<RegexExtractorPage />} />
        <Route path="/tool/batch" element={<BatchTransformPage />} />
        <Route path="/tool/schema" element={<SchemaValidatorPage />} />
        <Route path="/tool/format" element={<JsonYamlFormatterPage />} />
        <Route path="/tool/ascii" element={<AsciiArtPage />} />
        <Route path="/tool/dns" element={<DnsToolkitPage />} />
        <Route path="/tool/webhook" element={<WebhookVerifierPage />} />
        <Route path="/tool/har" element={<HarInspectorPage />} />
        <Route path="/tool/cookies" element={<CookieAnalyzerPage />} />
        <Route path="/tool/ids" element={<IdUtilityPage />} />
        <Route path="/tool/timezone" element={<TimezoneLabPage />} />
        <Route path="/tool/policy" element={<PolicyLinterPage />} />
      </Route>
    </Routes>
  );
}
