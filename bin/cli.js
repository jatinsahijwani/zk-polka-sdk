#!/usr/bin/env node

const { program } = require('commander');
const { compileCircuit } = require('../lib/compile');
const { testCircuit } = require('../lib/test');

program
  .command('compile <circomFilePath>')
  .description('Compile a circom circuit')
  .action((circomFilePath) => {
    compileCircuit(circomFilePath);
  });

program
  .command('test <folder> <inputJson>')
  .description('Test the circuit with input.json and generate proof/public.json')
  .action((folder, inputJson) => {
    testCircuit(folder, inputJson);
  });

  program.parse(process.argv);