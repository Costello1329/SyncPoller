import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import dracula from 'react-syntax-highlighter/dist/esm/styles/hljs/darcula';
import {PollQuestion} from "../../../services/poll";
import {localization} from "../../../static/Localization";
import {Checkbox} from "../../../components/userInterface/checkbox";

import "./styles.scss";



export class Question extends React.Component<PollQuestion> {
  declare private readonly inputType: "checkbox" | "radio" | "text";

  constructor (props: PollQuestion) {
    super(props);

    switch (this.props.solution.type) {
      case "selectMultiple":
        this.inputType = "checkbox";
        break;
      case "selectOne":
        this.inputType = "radio";
        break;
      case "textField":
        this.inputType = "text";
        break;
    }
  }

  private getProblem (): JSX.Element {
    return (
      <div className = "pollQuestionProblem">
        {
          this.props.problem.map(
            (block: PollQuestion["problem"][0]): JSX.Element => {
              if (block.type === "text")
                return (
                  <div className = "pollQuestionProblemText">
                    {block.text}
                  </div>
                );

              else if (block.type === "code")
                return (
                  <div className = "pollQuestionProblemCode">
                    <SyntaxHighlighter language = 'cpp' style = {dracula}>
                      {block.text}
                    </SyntaxHighlighter>
                  </div>
                );

              else
                return <></>;
            }
          )
        }
      </div>
    );
  }

  private getSolution (): JSX.Element {
    switch (this.props.solution.type) {
      case "selectMultiple":
        return (
          <div className = "pollQuestionSolutionBlock">
            {
              (
                (): JSX.Element[] => {
                  return this.props.solution.labels.map(
                    (label: string): JSX.Element => {
                      return (
                        <div
                          className ={"pollQuestionSolutionBlockCheckbox"}
                        >
                          <Checkbox
                            label = {label}
                            checked = {true}
                          />
                        </div>
                      );
                    }
                  );
                }
              )()
            }
          </div>
        );
      case "selectOne":
        return <></>;
      case "textField":
        return (
          <div className = "pollQuestionSolutionBlock">
            <textarea></textarea>
          </div>
        );
    }
  }

  render (): JSX.Element {
    return (
      <div className = "pollQuestion">
        <div className = "pollQuestionProblemHeader">
          <h1>{this.props.title}</h1>
        </div>
        {this.getProblem()}
        <div className = "pollQuestionSolutionHeader">
          <h2>{localization.solution()}</h2>
        </div>
        <div className = "pollQuestionSolution">
          {this.getSolution()}
        </div>
      </div>
    );
  }
}
