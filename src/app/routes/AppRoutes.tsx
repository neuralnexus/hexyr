import { Navigate, Route, Routes } from 'react-router-dom';
import { Asn1ViewerPage } from '../features/asn1/Asn1ViewerPage';
import { Base64Page } from '../features/base64/Base64Page';
import { BatchTransformPage } from '../features/batch/BatchTransformPage';
import { BinaryPage } from '../features/binary/BinaryPage';
import { BitwisePage } from '../features/bitwise/BitwisePage';
import { ByteInspectorPage } from '../features/bytes/ByteInspectorPage';
import { CertInspectorPage } from '../features/cert/CertInspectorPage';
import { CompressionPage } from '../features/compress/CompressionPage';
import { DiffPage } from '../features/diff/DiffPage';
import { HashPage } from '../features/hash/HashPage';
import { HexPage } from '../features/hex/HexPage';
import { HexdumpPage } from '../features/hexdump/HexdumpPage';
import { HtmlPage } from '../features/html/HtmlPage';
import { InspectorPage } from '../features/inspector/InspectorPage';
import { JwtPage } from '../features/jwt/JwtPage';
import { PcapLitePage } from '../features/pcap/PcapLitePage';
import { QueryPlaygroundPage } from '../features/query/QueryPlaygroundPage';
import { RedactionPage } from '../features/redact/RedactionPage';
import { HttpReplayPage } from '../features/replay/HttpReplayPage';
import { RegexExtractorPage } from '../features/regex/RegexExtractorPage';
import { SchemaValidatorPage } from '../features/schema/SchemaValidatorPage';
import { HttpSignerPage } from '../features/signer/HttpSignerPage';
import { TlsVerifierPage } from '../features/tls/TlsVerifierPage';
import { UnicodePage } from '../features/unicode/UnicodePage';
import { UrlPage } from '../features/url/UrlPage';
import { AppLayout } from '../layouts/AppLayout';

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
      </Route>
    </Routes>
  );
}
