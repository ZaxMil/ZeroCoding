import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SchemaLDProps {
  data: Record<string, any> | Array<Record<string, any>>;
}

const SchemaLD: React.FC<SchemaLDProps> = ({ data }) => {
  const schema = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : { '@context': 'https://schema.org', ...data };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default SchemaLD;
